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

# Correct two English translations of official game speaker labels that had
# collapsed the individually named Wong sisters into their collective identity.
GAME_SPEAKER_EN_OVERRIDES = {
    "黄天明": "Tinming Wong",
    "黄天祥": "Tinchen Wong",
}


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
) -> dict[str, object]:
    speaker_jp, speaker_en = resolve_speaker(source_row, target_row)
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
            compact_line(source_rows[row["line_id"]], row, sequence)
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
