#!/usr/bin/env python3
"""Build compact, chapter-split reader data from the BST translation workspace."""

from __future__ import annotations

import argparse
import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRANSLATION_ROOT = REPOSITORY_ROOT.parent / "BST_MTL" / "work" / "translation"
SPEAKER_OVERRIDES_PATH = REPOSITORY_ROOT / "tools" / "speaker_overrides.tsv"

# Correct two target labels that collapsed the individually named Wong sisters
# into their collective identity. All other game-provided English labels come
# from the translation workspace and its proper-noun authority.
GAME_SPEAKER_EN_OVERRIDES = {
    "黄天明": "Tinming Wong",
    "黄天祥": "Tinchen Wong",
}


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def read_speaker_overrides(path: Path) -> dict[str, tuple[str, str]]:
    overrides: dict[str, tuple[str, str]] = {}
    for row in read_tsv(path):
        line_id = (row.get("line_id") or "").strip()
        speaker_jp = (row.get("speaker_jp") or "").strip()
        speaker_en = (row.get("speaker_en") or "").strip()
        if not line_id or not speaker_jp or not speaker_en:
            raise SystemExit(f"Incomplete speaker override in {path}: {row}")
        if line_id in overrides:
            raise SystemExit(f"Duplicate speaker override: {line_id}")
        overrides[line_id] = (speaker_jp, speaker_en)
    return overrides


def is_standalone_spoken_line(text: str) -> bool:
    """Return true for a complete Japanese dialogue line, not an inline quote."""
    stripped = text.strip(" \t\u3000")
    return stripped.startswith("「") and stripped.endswith("」")


def resolve_speaker(
    source_row: dict[str, str],
    target_row: dict[str, str],
    speaker_overrides: dict[str, tuple[str, str]],
) -> tuple[str, str]:
    line_id = target_row["line_id"]
    if line_id in speaker_overrides:
        return speaker_overrides[line_id]

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

    if is_standalone_spoken_line(target_row.get("jp_text") or ""):
        # The game deliberately omits the speaker marker for viewpoint dialogue.
        # A neutral label avoids exposing identity twists before the script does.
        return ("語り手", "Narrator")

    return ("", "")


def compact_line(
    source_row: dict[str, str],
    target_row: dict[str, str],
    speaker_overrides: dict[str, tuple[str, str]],
    sequence: int,
) -> dict[str, object]:
    speaker_jp, speaker_en = resolve_speaker(source_row, target_row, speaker_overrides)
    return {
        "id": target_row["line_id"],
        "i": sequence,
        "n": int(target_row["row_index"]),
        "sj": speaker_jp,
        "se": speaker_en,
        "jp": target_row.get("jp_text", ""),
        "en": target_row.get("en_text", ""),
    }


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")


def build(translation_root: Path, output_root: Path) -> dict[str, object]:
    manifest_path = translation_root / "chapter_manifest.tsv"
    if not manifest_path.is_file():
        raise SystemExit(f"Chapter manifest not found: {manifest_path}")

    speaker_overrides = read_speaker_overrides(SPEAKER_OVERRIDES_PATH)
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
                source_rows[row["line_id"]], row, speaker_overrides, sequence
            )
            for sequence, row in enumerate(translated_rows, start=1)
        ]
        if not translated:
            continue

        sheet = manifest_row["sheet"]
        slug = sheet.upper()
        total_lines = int(manifest_row["text_rows"])
        metadata = {
            "slug": slug,
            "title": sheet,
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
    index = {
        "version": 1,
        "updated": generated_at.strftime("%Y-%m-%d"),
        "generatedAt": generated_at.isoformat(timespec="seconds"),
        "translatedLines": translated_total,
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
