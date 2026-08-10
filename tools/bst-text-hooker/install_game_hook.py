#!/usr/bin/env python3
"""Install BST's stable Unity-log dialogue and selection hooks."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
from pathlib import Path


DEBUG_LOG_VA = 0x1816401C0
TEXT_DATA_GET_ORIGINAL_VA = 0x180D31AB0
ADV_PAGE_GET_TEXT_DATA_VA = 0x18098BDB0
ADV_PAGE_GET_CURRENT_DATA_VA = 0x18098ACE0
SCENARIO_PAGE_GET_PAGE_NO_VA = 0x18098C740
PAGE_SET_TEXT_VA = 0x182232570
ADV_SELECTION_SET_TEXT_VA = 0x1801C9B10
ADV_SELECTION_SET_EXPRESSION_VA = 0x1801C89F0
ADV_COMMAND_PARSE_LOCALIZED_TEXT_VA = 0x180E2C600

DIALOGUE_PATCH_VA = 0x1809897CA
CHOICE_PATCH_VA = 0x180BAA26B

DIALOGUE_ORIGINAL = bytes.fromhex(
    "33 d2 48 8b 8c 24 d0 00 00 00 "
    "e8 07 15 00 00 48 89 84 24 b0 00 00 00 "
    "48 8b 8c 24 b0 00 00 00 e8 d2 e1 7d ff "
    "33 d2 48 8b 8c 24 b0 00 00 00 e8 43 2f 00 00 "
    "89 84 24 b8 00 00 00 "
    "48 8b 8c 24 98 00 00 00 e8 af e1 7d ff "
    "48 c7 44 24 20 00 00 00 00 "
    "44 8b 8c 24 b8 00 00 00 "
    "4c 8b 84 24 a8 00 00 00 "
    "48 8b 94 24 a0 00 00 00 "
    "48 8b 8c 24 98 00 00 00 "
    "e8 31 8d 8a 01"
)

CHOICE_ORIGINAL = bytes.fromhex(
    "48 8b 84 24 a0 00 00 00 48 89 44 24 28 "
    "48 8b 54 24 28 48 8b 8c 24 90 00 00 00 e8 86 f8 61 ff "
    "48 8b 84 24 a8 00 00 00 48 89 44 24 30 "
    "48 8b 54 24 30 48 8b 8c 24 90 00 00 00 e8 47 e7 61 ff"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def va_to_offset(data: bytes, va: int) -> int:
    pe = struct.unpack_from("<I", data, 0x3C)[0]
    section_count = struct.unpack_from("<H", data, pe + 6)[0]
    optional_size = struct.unpack_from("<H", data, pe + 20)[0]
    image_base = struct.unpack_from("<Q", data, pe + 48)[0]
    rva = va - image_base
    for index in range(section_count):
        section = pe + 24 + optional_size + index * 40
        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(
            "<IIII", data, section + 8
        )
        if virtual_address <= rva < virtual_address + max(virtual_size, raw_size):
            return raw_offset + rva - virtual_address
    raise ValueError(f"VA {va:#x} is outside the PE sections")


def rel32(opcode_va: int, target_va: int) -> bytes:
    return b"\xE8" + struct.pack("<i", target_va - (opcode_va + 5))


def cumulative_dialogue_hook() -> bytes:
    code = bytearray()
    code += bytes.fromhex("33 d2 48 8b 8c 24 d0 00 00 00")
    code += rel32(DIALOGUE_PATCH_VA + len(code), ADV_PAGE_GET_CURRENT_DATA_VA)
    code += bytes.fromhex("48 89 c1 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), SCENARIO_PAGE_GET_PAGE_NO_VA)
    code += bytes.fromhex("89 c7")
    code += bytes.fromhex("48 8b 8c 24 d0 00 00 00 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), ADV_PAGE_GET_TEXT_DATA_VA)
    code += bytes.fromhex("48 89 c1 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), TEXT_DATA_GET_ORIGINAL_VA)
    code += bytes.fromhex("48 89 c1 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), DEBUG_LOG_VA)
    code += bytes.fromhex(
        "33 c0 48 89 44 24 20 41 89 f9 "
        "4c 8b 84 24 a8 00 00 00 "
        "48 8b 94 24 a0 00 00 00 "
        "48 8b 8c 24 98 00 00 00"
    )
    code += rel32(DIALOGUE_PATCH_VA + len(code), PAGE_SET_TEXT_VA)
    code += b"\x90" * (len(DIALOGUE_ORIGINAL) - len(code))
    if len(code) != len(DIALOGUE_ORIGINAL):
        raise RuntimeError("Dialogue hook size mismatch")
    return bytes(code)


def dialogue_hook() -> bytes:
    """Log the exact AdvCommandText being advanced, not the cumulative page."""
    code = bytearray()
    code += bytes.fromhex("33 d2 48 8b 8c 24 d0 00 00 00")
    code += rel32(DIALOGUE_PATCH_VA + len(code), ADV_PAGE_GET_CURRENT_DATA_VA)
    code += bytes.fromhex("48 89 c1 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), SCENARIO_PAGE_GET_PAGE_NO_VA)
    code += bytes.fromhex("89 c7")
    code += bytes.fromhex("48 8b 8c 24 d8 00 00 00 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), ADV_COMMAND_PARSE_LOCALIZED_TEXT_VA)
    code += bytes.fromhex("48 89 c1 33 d2")
    code += rel32(DIALOGUE_PATCH_VA + len(code), DEBUG_LOG_VA)
    code += bytes.fromhex(
        "33 c0 48 89 44 24 20 41 89 f9 "
        "4c 8b 84 24 a8 00 00 00 "
        "48 8b 94 24 a0 00 00 00 "
        "48 8b 8c 24 98 00 00 00"
    )
    code += rel32(DIALOGUE_PATCH_VA + len(code), PAGE_SET_TEXT_VA)
    code += b"\x90" * (len(DIALOGUE_ORIGINAL) - len(code))
    if len(code) != len(DIALOGUE_ORIGINAL):
        raise RuntimeError("Dialogue hook size mismatch")
    return bytes(code)


def choice_hook() -> bytes:
    code = bytearray()
    code += bytes.fromhex("48 8b bc 24 a0 00 00 00 48 89 fa")
    code += bytes.fromhex("48 8b 8c 24 90 00 00 00")
    code += rel32(CHOICE_PATCH_VA + len(code), ADV_SELECTION_SET_TEXT_VA)
    code += bytes.fromhex("48 89 f9 33 d2")
    code += rel32(CHOICE_PATCH_VA + len(code), DEBUG_LOG_VA)
    code += bytes.fromhex("48 8b 94 24 a8 00 00 00")
    code += bytes.fromhex("48 8b 8c 24 90 00 00 00")
    code += rel32(CHOICE_PATCH_VA + len(code), ADV_SELECTION_SET_EXPRESSION_VA)
    code += b"\x90" * (len(CHOICE_ORIGINAL) - len(code))
    if len(code) != len(CHOICE_ORIGINAL):
        raise RuntimeError("Choice hook size mismatch")
    return bytes(code)


def patch_region(
    data: bytearray,
    va: int,
    originals: bytes | tuple[bytes, ...],
    replacement: bytes,
    label: str,
) -> None:
    offset = va_to_offset(data, va)
    supported = (originals,) if isinstance(originals, bytes) else originals
    current = bytes(data[offset : offset + len(replacement)])
    if current not in (*supported, replacement):
        raise RuntimeError(
            f"Unsupported GameAssembly.dll: unexpected {label} bytes at {va:#x}"
        )
    data[offset : offset + len(replacement)] = replacement


def install(game: Path) -> dict[str, object]:
    game = game.expanduser().resolve()
    assembly = game / "GameAssembly.dll"
    if not assembly.is_file():
        raise FileNotFoundError(f"GameAssembly.dll was not found in {game}")

    data = bytearray(assembly.read_bytes())
    patch_region(
        data,
        DIALOGUE_PATCH_VA,
        (DIALOGUE_ORIGINAL, cumulative_dialogue_hook()),
        dialogue_hook(),
        "dialogue",
    )
    patch_region(data, CHOICE_PATCH_VA, CHOICE_ORIGINAL, choice_hook(), "choice")

    backup = assembly.with_name("GameAssembly.dll.pre-bst-text-hook")
    if not backup.exists():
        shutil.copy2(assembly, backup)
    temporary = assembly.with_suffix(".dll.bst-text-hook")
    temporary.write_bytes(data)
    temporary.replace(assembly)
    return {
        "game": str(game),
        "assembly_sha256": sha256(assembly),
        "backup": str(backup),
        "dialogue": True,
        "choices": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Install the BLACK SHEEP TOWN Unity-log text hook"
    )
    parser.add_argument("game", type=Path, help="folder containing Bst.exe")
    args = parser.parse_args()
    print(json.dumps(install(args.game), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
