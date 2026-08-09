#!/usr/bin/env python3
"""Build compact, chapter-split reader data from the BST translation workspace."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from datetime import datetime, timezone
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


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def resolve_speaker(
    source_row: dict[str, str],
    target_row: dict[str, str],
) -> tuple[str, str]:
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

    return ("", "")


def compact_line(
    source_row: dict[str, str],
    target_row: dict[str, str],
    sequence: int,
    visual: dict[str, object] | None = None,
) -> dict[str, object]:
    speaker_jp, speaker_en = resolve_speaker(source_row, target_row)
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
    workspace_root = translation_root.parent
    order_path = workspace_root / "notes" / "chapter_unlock_and_editorial_reading_order.md"
    progression_source = REPOSITORY_ROOT / "data" / "scenario-progression.json"
    if not order_path.is_file() or not progression_source.is_file():
        raise SystemExit("Scenario progression sources were not found")

    note = order_path.read_text(encoding="utf-8")
    try:
        order_section = note.split("## Default editorial read-through", 1)[1].split(
            "This sequence", 1
        )[0]
    except IndexError as error:
        raise SystemExit("The editorial reading-order section could not be parsed") from error
    vn_order = [slug.upper() for slug in re.findall(r"`([^`]+)`", order_section)]

    progression = json.loads(progression_source.read_text(encoding="utf-8"))
    chapters = progression["chapters"]
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
        "Default editorial read-through reconstructed from "
        "ScenarioButton.requireScenarios; concurrent choices follow the game's button order"
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
        translated = [
            compact_line(
                source_rows[row["line_id"]],
                row,
                sequence,
                visual_states.get(row["line_id"]),
            )
            for sequence, row in enumerate(translated_rows, start=1)
        ]
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
