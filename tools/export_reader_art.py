#!/usr/bin/env python3
"""Export the VN backgrounds and character art used by the script reader.

BLACK SHEEP TOWN stores ordinary backgrounds as Unity Texture2D objects and
event/character art in UTAGE dicing atlases.  This script exports only artwork
referenced by the translated scenario, writes web-sized WebP files, and records
stable source-name-to-URL mappings for ``build_data.py``.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import UnityPy
from PIL import Image


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BST_ROOT = REPOSITORY_ROOT.parent / "BST_MTL"
TAG_RE = re.compile(r"<[^>]+>")


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def safe_name(prefix: str, source_name: str) -> str:
    digest = hashlib.sha1(source_name.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}-{digest}.webp"


def object_name(raw: bytes) -> tuple[str, int]:
    size = struct.unpack_from("<i", raw, 28)[0]
    name = raw[32 : 32 + size].decode("utf-8")
    return name, (32 + size + 3) & ~3


class BinaryReader:
    def __init__(self, data: bytes, offset: int):
        self.data = data
        self.offset = offset

    def int32(self) -> int:
        value = struct.unpack_from("<i", self.data, self.offset)[0]
        self.offset += 4
        return value

    def int64(self) -> int:
        value = struct.unpack_from("<q", self.data, self.offset)[0]
        self.offset += 8
        return value

    def string(self) -> str:
        size = self.int32()
        if size < 0 or self.offset + size > len(self.data):
            raise ValueError(f"Invalid string length {size} at {self.offset - 4:#x}")
        value = self.data[self.offset : self.offset + size].decode("utf-8")
        self.offset = (self.offset + size + 3) & ~3
        return value


@dataclass(frozen=True)
class DicedImage:
    name: str
    atlas_name: str
    width: int
    height: int
    cell_indices: tuple[int, ...]
    transparent_index: int


@dataclass
class DicingArchive:
    cell_size: int
    padding: int
    records: dict[str, DicedImage]


def parse_dicing_archive(raw: bytes) -> DicingArchive:
    _, start = object_name(raw)
    reader = BinaryReader(raw, start)
    cell_size = reader.int32()
    padding = reader.int32()
    atlas_count = reader.int32()
    for _ in range(atlas_count):
        reader.int32()  # PPtr file ID
        reader.int64()  # PPtr path ID
    record_count = reader.int32()
    records: dict[str, DicedImage] = {}
    for _ in range(record_count):
        name = reader.string()
        atlas_name = reader.string()
        width = reader.int32()
        height = reader.int32()
        index_count = reader.int32()
        indices = tuple(reader.int32() for _ in range(index_count))
        transparent_index = reader.int32()
        records[name] = DicedImage(
            name, atlas_name, width, height, indices, transparent_index
        )
    return DicingArchive(cell_size, padding, records)


def reconstruct_diced(
    archive: DicingArchive,
    record: DicedImage,
    atlases: dict[str, Image.Image],
) -> Image.Image:
    atlas = atlases[record.atlas_name]
    content_size = archive.cell_size - 2 * archive.padding
    columns = math.ceil(record.width / content_size)
    rows = math.ceil(record.height / content_size)
    expected = columns * rows
    if len(record.cell_indices) != expected:
        raise ValueError(
            f"{record.name}: expected {expected} dicing cells, found "
            f"{len(record.cell_indices)}"
        )
    cells_per_atlas_row = atlas.width // archive.cell_size
    result = Image.new("RGBA", (record.width, record.height), (0, 0, 0, 0))
    for index, cell_index in enumerate(record.cell_indices):
        if cell_index == record.transparent_index:
            continue
        row, column = divmod(index, columns)
        cell_row, cell_column = divmod(cell_index, cells_per_atlas_row)
        crop_width = min(content_size, record.width - column * content_size)
        crop_height = min(content_size, record.height - row * content_size)
        source_x = cell_column * archive.cell_size + archive.padding
        source_y = atlas.height - (
            cell_row * archive.cell_size + archive.padding + crop_height
        )
        patch = atlas.crop(
            (source_x, source_y, source_x + crop_width, source_y + crop_height)
        )
        target_y = record.height - (row * content_size + crop_height)
        result.alpha_composite(patch, (column * content_size, target_y))
    return result


def texture_definitions(compiled_root: Path) -> dict[str, dict[str, str]]:
    definitions: dict[str, dict[str, str]] = {}
    for path in sorted((compiled_root / "settings_raw").glob("*_Texture.tsv")):
        rows = read_tsv(path)
        if not rows:
            continue
        header = rows[0]
        columns = {
            value: key for key, value in header.items() if key.startswith("cell_") and value
        }
        for row in rows[1:]:
            entry = {name: row.get(column, "") for name, column in columns.items()}
            label = entry.get("Label", "")
            if label and entry.get("Type") == "Bg":
                definitions[label] = entry
    return definitions


def used_visuals(compiled_root: Path) -> tuple[set[str], set[str]]:
    rows = read_tsv(compiled_root / "master_script.tsv")
    background_labels = {
        row["arg1"] for row in rows if row["command"] == "Bg" and row["arg1"]
    }

    definitions = read_tsv(compiled_root / "character_definitions.tsv")
    by_pattern = {
        (row["CharacterName"], row["Pattern"]): row["SubFileName"]
        for row in definitions
        if row["SubFileName"]
    }
    defaults: dict[str, str] = {}
    for row in definitions:
        if row["SubFileName"]:
            defaults.setdefault(row["CharacterName"], row["SubFileName"])

    state: dict[str, dict[str, str]] = {}
    portraits: set[str] = set()
    for row in rows:
        if row["command"] == "CharacterOff":
            if row["arg1"]:
                state.pop(TAG_RE.sub("", row["arg1"]), None)
            else:
                state.clear()
        if row["line_type"] != "text" or not row["arg1"]:
            continue
        name = TAG_RE.sub("", row["arg1"])
        previous = state.get(name, {})
        pattern = row["arg2"] or previous.get("pattern", "")
        subfile = (
            by_pattern.get((name, pattern))
            or previous.get("subfile")
            or defaults.get(name)
        )
        if not subfile:
            continue
        state[name] = {
            "pattern": pattern,
            "subfile": subfile,
            "position": row["arg3"] or previous.get("position", ""),
        }
        portraits.add(subfile)
    return background_labels, portraits


def save_webp(
    image: Image.Image,
    destination: Path,
    *,
    max_width: int,
    max_height: int,
    quality: int,
) -> None:
    if destination.is_file() and destination.stat().st_size > 0:
        return
    image = image.convert("RGBA")
    if image.width > max_width or image.height > max_height:
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=quality, method=4)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bst-root", type=Path, default=DEFAULT_BST_ROOT)
    parser.add_argument("--output", type=Path, default=REPOSITORY_ROOT)
    args = parser.parse_args()

    bst_root = args.bst_root.resolve()
    output_root = args.output.resolve()
    compiled_root = bst_root / "work/compiled_export"
    resource_assets = bst_root / "BLACK SHEEP TOWN/Bst_Data/resources.assets"
    if not resource_assets.is_file():
        raise SystemExit(f"Unity resources were not found: {resource_assets}")

    background_labels, portrait_subfiles = used_visuals(compiled_root)
    texture_defs = texture_definitions(compiled_root)
    environment = UnityPy.load(str(resource_assets))
    texture_objects: dict[str, Any] = {}
    dicing_archives: dict[str, DicingArchive] = {}
    for obj in environment.objects:
        if obj.type.name == "Texture2D":
            texture = obj.read()
            texture_objects[texture.m_Name] = texture
        elif obj.type.name == "MonoBehaviour":
            raw = obj.get_raw_data()
            try:
                name, _ = object_name(raw)
            except (UnicodeDecodeError, struct.error):
                continue
            if name in {"Character", "Event"}:
                dicing_archives[name] = parse_dicing_archive(raw)

    atlas_names = {
        record.atlas_name
        for archive in dicing_archives.values()
        for record in archive.records.values()
    }
    atlases = {
        name: texture_objects[name].image.convert("RGBA")
        for name in atlas_names
        if name in texture_objects
    }

    background_urls: dict[str, str] = {}
    missing_backgrounds: list[str] = []
    for label in sorted(background_labels):
        definition = texture_defs.get(label)
        if not definition:
            missing_backgrounds.append(label)
            continue
        filename = definition.get("FileName", "")
        filetype = definition.get("FileType", "")
        subfile = definition.get("SubFileName", "")
        image: Image.Image | None = None
        source_key = ""
        if filetype == "Dicing" and filename.endswith(".asset"):
            archive_name = filename.removesuffix(".asset")
            archive = dicing_archives.get(archive_name)
            record = archive.records.get(subfile) if archive else None
            if archive and record:
                image = reconstruct_diced(archive, record, atlases)
                source_key = f"{archive_name}:{subfile}"
        elif filename in texture_objects:
            image = texture_objects[filename].image
            source_key = f"Texture2D:{filename}"
        if image is None:
            missing_backgrounds.append(label)
            continue
        relative = Path("assets/vn/backgrounds") / safe_name("bg", source_key)
        save_webp(
            image,
            output_root / relative,
            max_width=1600,
            max_height=900,
            quality=84,
        )
        background_urls[label] = relative.as_posix()

    portraits: dict[str, str] = {}
    character_archive = dicing_archives["Character"]
    for subfile in sorted(portrait_subfiles):
        record = character_archive.records.get(subfile)
        if not record:
            continue
        relative = Path("assets/vn/portraits") / safe_name("portrait", subfile)
        save_webp(
            reconstruct_diced(character_archive, record, atlases),
            output_root / relative,
            max_width=720,
            max_height=900,
            quality=88,
        )
        portraits[subfile] = relative.as_posix()

    manifest = {
        "backgrounds": background_urls,
        "portraits": portraits,
        "missingBackgroundLabels": missing_backgrounds,
    }
    manifest_path = output_root / "data/art-manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Exported {len(background_urls)} backgrounds and {len(portraits)} portraits; "
        f"{len(missing_backgrounds)} background labels had no exportable source."
    )


if __name__ == "__main__":
    main()
