#!/usr/bin/env python3
"""Build compact, chapter-split reader data from the BST translation workspace."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRANSLATION_ROOT = REPOSITORY_ROOT.parent / "BST_MTL" / "work" / "translation"

# Normalize the few official game labels whose draft speaker field either
# collapses an individual identity or retains a production-only qualifier.
GAME_SPEAKER_EN_OVERRIDES = {
    "黄天明": "Wong Tianming",
    "黄天祥": "Wong Tianxiang",
    "サーシェンカ白シャツ": "Sashen'ka",
}
TAG_RE = re.compile(r"<[^>]+>")

# Reader-only speaker attribution.  The game frequently omits Arg1 after a
# portrait is already on screen and lets the following narration identify the
# speaker.  That works in motion but leaves a static transcript ambiguous.
# Only infer a name from an explicit positive attribution on the next row; do
# not guess from portrait presence or dialogue alternation, and never label the
# route narrator.
SPEAKER_BY_TIPS_ID = {
    1: ("謝亮", "Xie Liang"),
    3: ("クリス・ツェー", "Chris Xie"),
    4: ("馬明", "Ma Ming"),
    5: ("太刀川良馬", "Ryouma Tachikawa"),
    10: ("見土道夫", "Michio Mido"),
    11: ("灰上璃映子", "Rieko Haigami"),
    12: ("灰上江梨子", "Eriko Haigami"),
    14: ("深沢聡", "Satoshi Fukazawa"),
    23: ("エリオット", "Elliott"),
    24: ("馬美美", "Ma Meimei"),
    25: ("馬世傑", "Ma Saiki"),
    26: ("劉建志", "Kenshi Ryuu"),
    27: ("廖志明", "Liao Zhiming"),
    28: ("トーマス・リャオ", "Tomas Liao"),
    29: ("アイス", "Aisu"),
    30: ("レイレイ", "Reirei"),
    31: ("エリー・ホワイト", "Elly White"),
    32: ("アサヒ", "Asahi"),
    33: ("壬生屋タカシ", "Takashi Mibuya"),
    34: ("ダリオ・ボネット", "Dario Bonetto"),
    35: ("ジョゼ・フェルナンデス", "Jose Fernandez"),
    36: ("アウロラ・フェルナンデス", "Aurora Fernandez"),
    37: ("アナ・クララ・フェルナンデス", "Anna Clara Fernandez"),
    38: ("リタ・フェルナンデス", "Rita Fernandez"),
    39: ("ジェフリー・ウォン", "Jeffrey Wong"),
    44: ("謝筱喬", "Xie Xiaoqiao"),
    48: ("堂島謙一", "Ken'ichi Doujima"),
    49: ("三芳星", "Hikari Miyoshi"),
    50: ("路地邦昭", "Kuniaki Roji"),
    51: ("熨田さくら", "Sakura Noshida"),
    52: ("ミアオ", "Miao"),
    53: ("ミユキ", "Miyuki"),
    54: ("汐健慈朗", "Kenjirou Shio"),
    55: ("汐松子", "Matsuko Shio"),
    56: ("菅原和美", "Kazumi Sugawara"),
    60: ("ロジャー・アダムス", "Roger Adams"),
    61: ("ヒトミ", "Hitomi"),
    62: ("マリア", "Maria"),
    63: ("サーシェンカ", "Sashen'ka"),
    64: ("アレクセイ", "Alexey"),
    65: ("エフゲニ・ヘス", "Evgenij Hess"),
    66: ("田中紺太", "Konta Tanaka"),
    67: ("カミラ・ノーサム", "Camilla Northam"),
    73: ("リュウカ", "Ryuka"),
    82: ("内田広美", "Hiromi Uchida"),
    83: ("能見美紗", "Misa Noumi"),
    84: ("マイケル・ツェー", "Michael Xie"),
    87: ("ベルーハ", "Belukha"),
    88: ("アンドリュー・マオ", "Andrew Mao"),
    89: ("ミスター・アーノルド", "Mr. Arnold"),
    90: ("ミスター・チェン", "Mr. Chen"),
    91: ("ミスター・スミス", "Mr. Smith"),
    92: ("水村舞子", "Maiko Mizumura"),
    93: ("林田雄一", "Yuuichi Hayashida"),
    94: ("吉田主任", "Chief Nurse Yoshida"),
    96: ("エンゾ・アラーニャ・エ・シウバ", "Enzo Aranha e Silva"),
    98: ("アレクサンドル", "Alexander Yakovlevich Chernykh"),
}
UNTAGGED_SPEAKER_CUES = {
    "Jennifer": ("ジェニファー", "Jennifer"),
    "Barbara": ("バーバラ", "Barbara"),
    "Carlotta": ("カルロッタ", "Carlotta"),
    "Hashimoto": ("ハシモト", "Hashimoto"),
    "Tanabe": ("タナベ", "Tanabe"),
    "Shimizu": ("シミズ", "Shimizu"),
    "Nancy": ("ナンシー・リュー", "Nancy Liu"),
    "Furukawa": ("フルカワ", "Furukawa"),
    "Nurse Mita": ("箕田", "Nurse Mita"),
    "Fujiwara": ("藤原", "Fujiwara"),
}
POSITIVE_SPEECH_VERB = (
    r"(?:says?|said|asks?|asked|answers?|answered|repl(?:y|ies|ied)|"
    r"whispers?|whispered|murmurs?|murmured|shouts?|shouted|cries?|cried|"
    r"calls? (?:out|after|back|to)|called (?:out|after|back|to)|"
    r"declares?|declared|speaks?|spoke|snaps?|snapped|"
    r"continues?|continued|adds?|added|remarks?|remarked|responds?|responded|"
    r"retorts?|retorted|demands?|demanded|insists?|insisted|groans?|groaned|"
    r"stammers?|stammered)"
)
NEGATIVE_ATTRIBUTION_RE = re.compile(
    r"\b(?:says? nothing|said nothing|does not answer|doesn't answer|"
    r"did not answer|didn't answer|silent nod|without (?:saying|a word))\b",
    re.IGNORECASE,
)
TIPS_SUBJECT_ATTRIBUTION_RE = re.compile(
    rf"<tips=(\d+)>[^<]+</tips>(?![’']s)"
    rf"(?:,\s*[^,.!?<>]{{1,55}},)?\s+"
    rf"(?:(?:finally|quietly|softly|simply|only|still|then|also|suddenly|"
    rf"immediately|flatly|calmly|brusquely|timidly|hoarsely)\s+){{0,2}}"
    rf"\b{POSITIVE_SPEECH_VERB}\b",
    re.IGNORECASE,
)
SPEAKER_INFERENCE_EXCLUSIONS = {
    # The following narration names somebody other than the speaker, refers to
    # an earlier statement, or introduces the next line of dialogue.
    "A5:0068",
    "B1:0718",
    "E4:0255",
    "E5:0438",
    "G2:0410",
    "X3-2:0842",
    "x12:0152",
    "X13:0605",
    "X15-1:0162",
}


def route_narrator_tip_ids(sheet: str) -> set[int]:
    family = sheet[:1].upper()
    return {
        "A": {1},
        "B": {10},
        "C": {5},
        "D": {51},
        "E": {50},
        "F": {11, 12, 86},
        "G": {55},
    }.get(family, set())


def inferred_speaker_from_following_attribution(
    row: dict[str, str],
    following: dict[str, str] | None,
) -> tuple[str, str] | None:
    if row["line_id"] in SPEAKER_INFERENCE_EXCLUSIONS:
        return None
    if following is None:
        return None
    japanese = (row.get("jp_text") or "").lstrip()
    if not japanese.startswith(("「", "『")):
        return None
    narration = (following.get("en_text") or "").strip()
    if not narration or (following.get("jp_text") or "").lstrip().startswith(("「", "『")):
        return None
    if NEGATIVE_ATTRIBUTION_RE.search(narration):
        return None

    match = TIPS_SUBJECT_ATTRIBUTION_RE.search(narration)
    if match:
        tips_id = int(match.group(1))
        if tips_id in route_narrator_tip_ids(row["sheet"]):
            return None
        return SPEAKER_BY_TIPS_ID.get(tips_id)

    for visible_name, speaker in UNTAGGED_SPEAKER_CUES.items():
        pattern = re.compile(
            rf"\b{re.escape(visible_name)}\b(?![’']s)"
            rf"(?:,\s*[^,.!?<>]{{1,55}},)?\s+"
            rf"(?:(?:finally|quietly|softly|simply|only|still|then|also|"
            rf"suddenly|immediately|flatly|calmly|brusquely|timidly|hoarsely)\s+){{0,2}}"
            rf"\b{POSITIVE_SPEECH_VERB}\b",
            re.IGNORECASE,
        )
        if pattern.search(narration):
            return speaker
    return None


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def resolve_speaker(
    source_row: dict[str, str],
    target_row: dict[str, str],
    inferred_speaker: tuple[str, str] | None = None,
    corrected_speaker: tuple[str, str] | None = None,
) -> tuple[str, str]:
    if corrected_speaker is not None:
        return corrected_speaker
    game_speaker = (source_row.get("speaker") or "").strip()
    if game_speaker:
        translated_speaker = GAME_SPEAKER_EN_OVERRIDES.get(
            game_speaker,
            (target_row.get("speaker_en") or "").strip() or game_speaker,
        )
        return (
            game_speaker,
            translated_speaker,
        )

    return inferred_speaker or ("", "")


def compact_line(
    source_row: dict[str, str],
    target_row: dict[str, str],
    sequence: int,
    visual: dict[str, object] | None = None,
    inferred_speaker: tuple[str, str] | None = None,
    corrected_speaker: tuple[str, str] | None = None,
) -> dict[str, object]:
    speaker_jp, speaker_en = resolve_speaker(
        source_row,
        target_row,
        inferred_speaker=inferred_speaker,
        corrected_speaker=corrected_speaker,
    )
    result: dict[str, object] = {
        "id": target_row["line_id"],
        "i": sequence,
        "n": int(target_row["row_index"]),
        "sj": speaker_jp,
        "se": speaker_en,
        "jp": target_row.get("jp_text", ""),
        "en": target_row.get("en_text", ""),
    }
    if visual:
        result.update(visual)
    return result


def load_speaker_corrections(translation_root: Path) -> dict[str, tuple[str, str]]:
    path = translation_root.parent / "editorial" / "speaker_label_corrections.tsv"
    if not path.is_file():
        return {}
    corrections: dict[str, tuple[str, str]] = {}
    for row in read_tsv(path):
        corrections[row["line_id"]] = (
            (row.get("corrected_speaker_jp") or "").strip(),
            (row.get("corrected_speaker_en") or "").strip(),
        )
    return corrections


def load_historic_speaker_attributions(
    translation_root: Path,
) -> dict[str, tuple[str, str]]:
    """Recover production speaker markers omitted by the compact export.

    The original text-asset audit retained UTAGE's preceding speaker command
    on sustained conversations. The compact compiled master keeps fewer of
    those commands. Align the two Japanese text streams by sheet and import
    only exact text matches carrying a non-empty production speaker marker.
    """
    workspace_root = translation_root.parent
    historic_path = workspace_root / "textassets_export/source_script_master.tsv"
    current_path = workspace_root / "compiled_export/master_script.tsv"
    manifest_path = translation_root / "chapter_manifest.tsv"
    if not historic_path.is_file() or not current_path.is_file():
        return {}

    english_names: dict[str, str] = {}
    for chapter in read_tsv(manifest_path):
        for row in read_tsv(translation_root / chapter["target_file"]):
            japanese = (row.get("speaker_jp") or "").strip()
            english = (row.get("speaker_en") or "").strip()
            if japanese and english:
                previous = english_names.setdefault(japanese, english)
                if previous != english:
                    raise SystemExit(
                        f"Conflicting standardized speaker name for {japanese!r}: "
                        f"{previous!r} / {english!r}"
                    )

    historic_by_sheet: dict[str, list[dict[str, str]]] = defaultdict(list)
    current_by_sheet: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in read_tsv(historic_path):
        if row.get("line_type") in {"dialogue", "narrative"}:
            historic_by_sheet[row["asset"]].append(row)
    for row in read_tsv(current_path):
        if row.get("line_type") == "text":
            current_by_sheet[row["sheet"]].append(row)

    attributions: dict[str, tuple[str, str]] = {}
    for sheet, current_rows in current_by_sheet.items():
        historic_rows = historic_by_sheet.get(sheet, [])
        matcher = SequenceMatcher(
            None,
            [row.get("jp_source", "") for row in historic_rows],
            [row.get("jp_text", "") for row in current_rows],
            autojunk=False,
        )
        for historic_start, current_start, length in matcher.get_matching_blocks():
            for offset in range(length):
                historic = historic_rows[historic_start + offset]
                speaker = (historic.get("speaker") or "").strip()
                if not speaker:
                    continue
                normalized = re.split(r"\s+[Aa]rg[23]=", speaker, maxsplit=1)[0]
                english = english_names.get(normalized)
                if not english:
                    raise SystemExit(
                        f"Historic speaker label lacks a standardized name: {speaker!r}"
                    )
                english = GAME_SPEAKER_EN_OVERRIDES.get(normalized, english)
                current = current_rows[current_start + offset]
                attributions[current["line_id"]] = (normalized, english)
    return attributions


def portrait_position(position: str) -> tuple[str, str, str]:
    """Convert the game's named character anchor into compact reader coordinates."""
    if "最左" in position:
        horizontal = "fl"
    elif "最右" in position:
        horizontal = "fr"
    elif "左" in position:
        horizontal = "l"
    elif "右" in position:
        horizontal = "r"
    else:
        horizontal = "c"

    if "上" in position:
        vertical = "t"
    elif "下" in position:
        vertical = "b"
    else:
        vertical = "m"

    side = "l" if horizontal in {"fl", "l"} else "r" if horizontal in {"r", "fr"} else "c"
    return side, horizontal, vertical


def load_visual_states(translation_root: Path) -> dict[str, dict[str, object]]:
    """Recreate VN background and character state at every translated text row."""
    compiled_root = translation_root.parent / "compiled_export"
    master_path = compiled_root / "master_script.tsv"
    definitions_path = compiled_root / "character_definitions.tsv"
    manifest_path = REPOSITORY_ROOT / "data" / "art-manifest.json"
    if not master_path.is_file() or not definitions_path.is_file() or not manifest_path.is_file():
        return {}

    art = json.loads(manifest_path.read_text(encoding="utf-8"))
    background_urls: dict[str, str] = art.get("backgrounds", {})
    portrait_urls: dict[str, str] = art.get("portraits", {})
    definitions = read_tsv(definitions_path)
    by_pattern = {
        (row["CharacterName"], row["Pattern"]): row["SubFileName"]
        for row in definitions
        if row["SubFileName"]
    }
    defaults: dict[str, str] = {}
    for row in definitions:
        if row["SubFileName"]:
            defaults.setdefault(row["CharacterName"], row["SubFileName"])

    visuals: dict[str, dict[str, object]] = {}
    character_state: dict[str, dict[str, str]] = {}
    current_sheet = ""
    current_background = ""
    pending_background = ""
    for row in read_tsv(master_path):
        if row["sheet"] != current_sheet:
            current_sheet = row["sheet"]
            current_background = ""
            pending_background = ""
            character_state.clear()

        command = row["command"]
        if command == "Bg":
            label = row["arg1"]
            if label != current_background:
                current_background = label
                pending_background = background_urls.get(label, "")
        elif command == "BgOff":
            current_background = ""
            pending_background = ""
        elif command == "CharacterOff":
            if row["arg1"]:
                character_state.pop(TAG_RE.sub("", row["arg1"]), None)
            else:
                character_state.clear()

        # In UTAGE, a character can be shown, moved, or have its expression
        # changed on a blank scenario row before the next line of prose.  Those
        # rows are part of the game's visual timeline even though they have no
        # translatable text, so consume every real character event first.
        if not command and row["arg1"]:
            name = TAG_RE.sub("", row["arg1"])
            previous = character_state.get(name, {})
            pattern = row["arg2"] or previous.get("pattern", "")
            subfile = (
                by_pattern.get((name, pattern))
                or previous.get("subfile")
                or defaults.get(name)
            )
            if subfile and subfile in portrait_urls:
                character_state[name] = {
                    "pattern": pattern,
                    "subfile": subfile,
                    "position": row["arg3"] or previous.get("position", ""),
                }

        if row["line_type"] != "text":
            continue

        visual: dict[str, object] = {}
        if pending_background:
            visual["bg"] = pending_background
            pending_background = ""
        if character_state:
            portraits = []
            for state in character_state.values():
                if state.get("subfile") not in portrait_urls:
                    continue
                side, horizontal, vertical = portrait_position(state.get("position", ""))
                portraits.append(
                    {
                        "u": portrait_urls[state["subfile"]],
                        "s": side,
                        "x": horizontal,
                        "y": vertical,
                    }
                )
            horizontal_order = {"fl": 0, "l": 1, "c": 2, "r": 3, "fr": 4}
            portraits.sort(key=lambda portrait: horizontal_order[portrait["x"]])
            if portraits:
                visual["p"] = portraits
        if visual:
            visuals[row["line_id"]] = visual
    return visuals


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def read_glossary_titles(path: Path) -> dict[int, str]:
    titles: dict[int, str] = {}
    pattern = re.compile(
        r"^\|\s*(\d+)\s*\|\s*[^|]+?\s*\|\s*\*\*([^*]+)\*\*\s*\|"
    )
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            titles[int(match.group(1))] = match.group(2).strip()
    return titles


def read_scenario_titles(translation_root: Path) -> dict[str, str]:
    path = translation_root / "support" / "scenario_buttons_en.tsv"
    if not path.is_file():
        raise SystemExit(f"Translated scenario titles not found: {path}")

    titles: dict[str, str] = {}
    for row in read_tsv(path):
        slug = (row.get("name") or "").strip().upper()
        title = (row.get("en_title") or "").strip()
        if slug and title:
            titles[slug] = title
    return titles


def sync_scenario_progression(translation_root: Path, output_root: Path) -> None:
    progression_source = REPOSITORY_ROOT / "data" / "scenario-progression.json"
    if not progression_source.is_file():
        raise SystemExit("Scenario progression sources were not found")

    progression = json.loads(progression_source.read_text(encoding="utf-8"))
    chapters = progression["chapters"]
    vn_order = [str(slug).upper() for slug in progression.get("vnOrder", [])]
    if len(vn_order) != len(chapters) or set(vn_order) != set(chapters):
        raise SystemExit("The editorial reading order does not contain every scenario once")
    positions = {slug: position for position, slug in enumerate(vn_order)}
    for chapter, requirements in chapters.items():
        for requirement in requirements:
            if positions[requirement] >= positions[chapter]:
                raise SystemExit(
                    f"Invalid editorial order: {chapter} appears before {requirement}"
                )

    progression["vnOrderSource"] = (
        "Content-optimized editorial reading order constrained by the shipped game's "
        "ScenarioButton.requireScenarios prerequisites"
    )
    progression["vnOrder"] = vn_order
    write_json(output_root / "scenario-progression.json", progression)


def build_glossary(
    translation_root: Path, output_root: Path, generated_at: datetime
) -> int:
    workspace_root = translation_root.parent
    records_path = workspace_root / "compiled_export" / "tips_records.tsv"
    names_path = workspace_root / "notes" / "proper_nouns_names_key_items.md"
    if not records_path.is_file() or not names_path.is_file():
        raise SystemExit("Glossary source files were not found in the BST workspace")

    english_titles = read_glossary_titles(names_path)
    groups: dict[int, dict[str, object]] = {}
    for row in read_tsv(records_path):
        group_id = int(row["tips_group_id"])
        if group_id not in english_titles:
            raise SystemExit(f"Missing standardized glossary title for Tips ID {group_id}")
        group = groups.setdefault(
            group_id,
            {
                "id": group_id,
                "enTitle": english_titles[group_id],
                "records": [],
            },
        )
        requirements = [
            row[f"need_file_{index}"].strip().upper()
            for index in range(1, 4)
            if row[f"need_file_{index}"].strip()
        ]
        group["records"].append(
            {
                "recordId": int(row["record_id"]),
                "priority": int(row["priority"]),
                "requires": requirements,
                "requireAll": row["and_condition"] == "1",
                "pronunciation": row["pronunciation"],
                "jpTitle": row["jp_title"],
                "jpDescription": row["jp_description"],
                "enTitle": row["en_title"],
                "enDescription": row["en_description"],
            }
        )

    glossary_groups = [groups[group_id] for group_id in sorted(groups)]
    for group in glossary_groups:
        group["records"].sort(key=lambda record: record["priority"])
    write_json(
        output_root / "glossary.json",
        {
            "generatedAt": generated_at.isoformat(timespec="seconds"),
            "groups": glossary_groups,
        },
    )
    return len(glossary_groups)


def build(translation_root: Path, output_root: Path) -> dict[str, object]:
    manifest_path = translation_root / "chapter_manifest.tsv"
    if not manifest_path.is_file():
        raise SystemExit(f"Chapter manifest not found: {manifest_path}")

    sync_scenario_progression(translation_root, output_root)

    visual_states = load_visual_states(translation_root)
    speaker_corrections = load_speaker_corrections(translation_root)
    historic_speakers = load_historic_speaker_attributions(translation_root)
    scenario_titles = read_scenario_titles(translation_root)
    chapters: list[dict[str, object]] = []
    translated_total = 0

    for manifest_row in read_tsv(manifest_path):
        target_path = translation_root / manifest_row["target_file"]
        if not target_path.is_file():
            continue

        source_path = translation_root / manifest_row["source_file"]
        if not source_path.is_file():
            raise SystemExit(f"Source chapter not found: {source_path}")
        source_rows = {row["line_id"]: row for row in read_tsv(source_path)}

        translated_rows = [
            row
            for row in read_tsv(target_path)
            if (row.get("en_text") or "").strip()
        ]
        translated = []
        for sequence, row in enumerate(translated_rows, start=1):
            following = (
                translated_rows[sequence]
                if sequence < len(translated_rows)
                else None
            )
            inferred_speaker = inferred_speaker_from_following_attribution(
                row,
                following,
            )
            inferred_speaker = historic_speakers.get(row["line_id"], inferred_speaker)
            translated.append(
                compact_line(
                    source_rows[row["line_id"]],
                    row,
                    sequence,
                    visual_states.get(row["line_id"]),
                    inferred_speaker=inferred_speaker,
                    corrected_speaker=speaker_corrections.get(row["line_id"]),
                )
            )
        if not translated:
            continue

        sheet = manifest_row["sheet"]
        slug = sheet.upper()
        title = scenario_titles.get(slug)
        if not title:
            raise SystemExit(f"Missing translated scenario title for {sheet}")
        total_lines = int(manifest_row["text_rows"])
        metadata = {
            "slug": slug,
            "title": title,
            "part": sheet[0].upper(),
            "translatedLines": len(translated),
            "totalLines": total_lines,
        }
        write_json(
            output_root / "chapters" / f"{slug}.json",
            {"chapter": metadata, "lines": translated},
        )
        chapters.append(metadata)
        translated_total += len(translated)

    generated_at = datetime.now(timezone.utc)
    glossary_groups = build_glossary(translation_root, output_root, generated_at)
    index = {
        "version": 2,
        "updated": generated_at.strftime("%Y-%m-%d"),
        "generatedAt": generated_at.isoformat(timespec="seconds"),
        "translatedLines": translated_total,
        "glossaryGroups": glossary_groups,
        "chapters": chapters,
    }
    write_json(output_root / "index.json", index)
    return index


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "translation_root",
        nargs="?",
        type=Path,
        default=Path(os.environ.get("BST_TRANSLATION_ROOT", DEFAULT_TRANSLATION_ROOT)),
        help="Path containing chapter_manifest.tsv and targets_by_sheet/",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=REPOSITORY_ROOT / "data",
        help="Reader data directory (default: repository data/)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    index = build(args.translation_root.resolve(), args.output.resolve())
    print(
        f"Built {len(index['chapters'])} chapters and "
        f"{index['translatedLines']:,} translated lines."
    )


if __name__ == "__main__":
    main()
