#!/usr/bin/env python3
"""Maintainer utility for BST's exact-line logger and reliable switch exit."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import struct
from pathlib import Path


PATCHER = Path(__file__).resolve().parent
HOOK_SOURCE = PATCHER.parent / "bst-text-hooker/install_game_hook.py"
# These addresses document the original retail layout.  Installation no
# longer relies on them: the callback tail and ExitProcess import are resolved
# from the PE itself so equivalent Steam/player builds can be patched safely.
LANGUAGE_EXIT_VA = 0x180D2D77D
EXIT_PROCESS_IAT_VA = 0x1822B24C0
LANGUAGE_EXIT_ORIGINAL = bytes.fromhex(
    "48 81 c4 d0 00 00 00 5f c3 cc cc cc cc cc cc cc cc cc cc"
)
LANGUAGE_EXIT_DEFERRED = bytes.fromhex(
    "b9 2a 00 00 00 e8 69 28 90 00 48 81 c4 d0 00 00 00 5f c3"
)


def load_hook_module():
    spec = importlib.util.spec_from_file_location("bst_install_game_hook", HOOK_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {HOOK_SOURCE}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LANGUAGE_CALLBACK_ANCHOR = bytes.fromhex(
    "48 89 84 24 c0 00 00 00 "
    "48 8b 8c 24 88 00 00 00 e8 00 00 00 00 "
    "45 33 c0 "
    "48 8b 94 24 c0 00 00 00 "
    "48 8b 8c 24 88 00 00 00 e8 00 00 00 00"
)
LANGUAGE_CALLBACK_MASK = (
    b"\xff" * 17 + b"\x00" * 4 + b"\xff" * 20 + b"\x00" * 4
)

# TipsDialog.Close normally restores the previous UI state from an animation
# completion callback.  Its null-animation branch skips that callback and
# leaves the story input disabled.  Long English entries enter the expanded
# layout often enough to expose the race.  The patch below turns only that
# null-animation branch into an immediate OnCloseAnimationEnd call.
TIPS_CLOSE_FALLBACK_PREFIX = bytes.fromhex(
    "48 89 44 24 48 48 83 7c 24 48 00 75 0a"
)
TIPS_ON_CLOSE_PREFIX = bytes.fromhex(
    "48 89 54 24 10 48 89 4c 24 08 57 48 83 ec 40 0f b6 05"
)


def immediate_exit_patch(tail_va: int, exit_process_iat_va: int) -> bytes:
    # push 42; pop rcx; call [ExitProcess]; nop; original function epilogue.
    call_va = tail_va + 3
    relative = exit_process_iat_va - (call_va + 6)
    return (
        bytes.fromhex("6a 2a 59 ff 15")
        + struct.pack("<i", relative)
        + b"\x90"
        + bytes.fromhex("48 81 c4 d0 00 00 00 5f c3")
    )


def pe_layout(data: bytes) -> tuple[int, int, int, int]:
    if data[:2] != b"MZ":
        raise ValueError("GameAssembly.dll is not a PE image")
    pe = struct.unpack_from("<I", data, 0x3C)[0]
    if data[pe : pe + 4] != b"PE\0\0":
        raise ValueError("GameAssembly.dll has an invalid PE header")
    section_count = struct.unpack_from("<H", data, pe + 6)[0]
    optional_size = struct.unpack_from("<H", data, pe + 20)[0]
    optional = pe + 24
    if struct.unpack_from("<H", data, optional)[0] != 0x20B:
        raise ValueError("GameAssembly.dll is not a PE32+ image")
    image_base = struct.unpack_from("<Q", data, optional + 24)[0]
    return pe, optional, section_count, image_base


def rva_to_offset(data: bytes, rva: int) -> int:
    pe, _optional, section_count, _image_base = pe_layout(data)
    optional_size = struct.unpack_from("<H", data, pe + 20)[0]
    for index in range(section_count):
        section = pe + 24 + optional_size + index * 40
        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(
            "<IIII", data, section + 8
        )
        if virtual_address <= rva < virtual_address + max(virtual_size, raw_size):
            return raw_offset + rva - virtual_address
    raise ValueError(f"RVA {rva:#x} is outside the PE sections")


def offset_to_va(data: bytes, offset: int) -> int:
    pe, _optional, section_count, image_base = pe_layout(data)
    optional_size = struct.unpack_from("<H", data, pe + 20)[0]
    for index in range(section_count):
        section = pe + 24 + optional_size + index * 40
        virtual_address, raw_size, raw_offset = struct.unpack_from(
            "<III", data, section + 12
        )
        if raw_offset <= offset < raw_offset + raw_size:
            return image_base + virtual_address + offset - raw_offset
    raise ValueError(f"File offset {offset:#x} is outside the PE sections")


def read_c_string(data: bytes, offset: int) -> str:
    end = data.find(b"\0", offset)
    if end < 0:
        raise ValueError("Unterminated PE import name")
    return data[offset:end].decode("ascii", errors="strict")


def find_import_iat_va(data: bytes, wanted_dll: str, wanted_name: str) -> int:
    _pe, optional, _section_count, image_base = pe_layout(data)
    import_rva, import_size = struct.unpack_from("<II", data, optional + 112 + 8)
    if not import_rva or not import_size:
        raise ValueError("GameAssembly.dll has no PE import table")
    descriptor = rva_to_offset(data, import_rva)
    wanted_dll = wanted_dll.lower()
    for _ in range(import_size // 20 + 1):
        original_thunk, _stamp, _chain, name_rva, first_thunk = struct.unpack_from(
            "<IIIII", data, descriptor
        )
        if not any((original_thunk, name_rva, first_thunk)):
            break
        dll_name = read_c_string(data, rva_to_offset(data, name_rva)).lower()
        if dll_name == wanted_dll:
            lookup_rva = original_thunk or first_thunk
            lookup = rva_to_offset(data, lookup_rva)
            index = 0
            while True:
                thunk = struct.unpack_from("<Q", data, lookup + index * 8)[0]
                if not thunk:
                    break
                if not (thunk & (1 << 63)):
                    name_offset = rva_to_offset(data, thunk & 0x7FFF_FFFF_FFFF_FFFF)
                    if read_c_string(data, name_offset + 2) == wanted_name:
                        return image_base + first_thunk + index * 8
                index += 1
        descriptor += 20
    raise ValueError(f"PE import {wanted_dll}!{wanted_name} was not found")


def masked_equal(data: bytes, offset: int, pattern: bytes, mask: bytes) -> bool:
    if offset < 0 or offset + len(pattern) > len(data):
        return False
    return all(not keep or data[offset + index] == pattern[index]
               for index, keep in enumerate(mask))


def find_all(data: bytes, pattern: bytes) -> list[int]:
    matches: list[int] = []
    cursor = 0
    while True:
        offset = data.find(pattern, cursor)
        if offset < 0:
            return matches
        matches.append(offset)
        cursor = offset + 1


def is_tips_on_close(data: bytes, offset: int) -> bool:
    """Match the stable control flow of TipsDialog.OnCloseAnimationEnd."""
    return (
        data[offset : offset + len(TIPS_ON_CLOSE_PREFIX)] == TIPS_ON_CLOSE_PREFIX
        and data[offset + 22 : offset + 28] == bytes.fromhex("85 c0 75 12 8b 0d")
        and data[offset + 32] == 0xE8
        and data[offset + 37 : offset + 39] == bytes.fromhex("c6 05")
        and data[offset + 43] == 0x01
        and data[offset + 44 : offset + 50] == bytes.fromhex("48 8b 4c 24 50 e8")
        and data[offset + 54 : offset + 72]
        == bytes.fromhex("88 44 24 20 0f b6 44 24 20 85 c0 74 04 eb 07 eb 05 e9")
    )


def patch_tips_close_fallback(data: bytearray) -> dict[str, int | bool]:
    fallback_matches: list[int] = []
    for offset in find_all(data, TIPS_CLOSE_FALLBACK_PREFIX):
        branch = offset + len(TIPS_CLOSE_FALLBACK_PREFIX)
        if branch + 10 > len(data) or data[branch] not in (0xE8, 0xE9):
            continue
        if data[branch + 5] != 0xE9:
            continue
        first_target = branch + 5 + struct.unpack_from("<i", data, branch + 1)[0]
        method_end = branch + 10 + struct.unpack_from("<i", data, branch + 6)[0]
        if not 0 < method_end - offset < 0x1000:
            continue
        # In the retail code both jumps converge on the method epilogue.  In
        # an already-fixed runtime, the first instruction is our call and the
        # second jump still identifies the same nearby epilogue.
        if data[branch] == 0xE9 and first_target != method_end:
            continue
        fallback_matches.append(offset)
    on_close_matches = [
        offset
        for offset in find_all(data, TIPS_ON_CLOSE_PREFIX)
        if is_tips_on_close(data, offset)
    ]
    pairs = [
        (fallback, on_close)
        for fallback in fallback_matches
        for on_close in on_close_matches
        if 0 < on_close - fallback < 0x4000
    ]
    if len(pairs) != 1:
        raise ValueError(
            "Could not uniquely pair TipsDialog.Close with OnCloseAnimationEnd "
            f"(found {len(pairs)} pairs from {len(fallback_matches)} fallbacks "
            f"and {len(on_close_matches)} completion methods)"
        )
    fallback, on_close = pairs[0]
    branch = fallback + len(TIPS_CLOSE_FALLBACK_PREFIX)
    branch_va = offset_to_va(data, branch)
    on_close_va = offset_to_va(data, on_close)
    replacement = b"\xe8" + struct.pack("<i", on_close_va - (branch_va + 5))
    current = bytes(data[branch : branch + 5])
    changed = current != replacement
    if current[0] not in (0xE8, 0xE9):
        raise ValueError("Tips close fallback has an unexpected branch opcode")
    data[branch : branch + 5] = replacement
    return {
        "tips_fallback_file_offset": branch,
        "tips_fallback_va": branch_va,
        "tips_on_close_va": on_close_va,
        "tips_fallback_changed": changed,
    }


def find_language_callback_tail(data: bytes) -> tuple[int, int]:
    if len(LANGUAGE_CALLBACK_ANCHOR) != len(LANGUAGE_CALLBACK_MASK):
        raise AssertionError("Language callback signature mask is malformed")
    prefix = LANGUAGE_CALLBACK_ANCHOR[:17]
    matches: list[tuple[int, int]] = []
    cursor = 0
    while True:
        offset = data.find(prefix, cursor)
        if offset < 0:
            break
        if masked_equal(data, offset, LANGUAGE_CALLBACK_ANCHOR, LANGUAGE_CALLBACK_MASK):
            tail = offset + len(LANGUAGE_CALLBACK_ANCHOR)
            current = bytes(data[tail : tail + 19])
            if current in (LANGUAGE_EXIT_ORIGINAL, LANGUAGE_EXIT_DEFERRED) or (
                current[:4] == bytes.fromhex("6a 2a 59 ff")
                and current[4] == 0x15
                and current[9:] == bytes.fromhex("90 48 81 c4 d0 00 00 00 5f c3")
            ):
                matches.append((tail, offset_to_va(data, tail)))
        cursor = offset + 1
    if len(matches) != 1:
        raise ValueError(
            "Could not uniquely locate SystemUiDebugMenu.OnClickChangeLanguage "
            f"(found {len(matches)} matching callback tails)"
        )
    return matches[0]


def patch_language_switch(data: bytearray) -> dict[str, int]:
    tail_offset, tail_va = find_language_callback_tail(data)
    exit_iat_va = find_import_iat_va(data, "kernel32.dll", "ExitProcess")
    replacement = immediate_exit_patch(tail_va, exit_iat_va)
    data[tail_offset : tail_offset + len(replacement)] = replacement
    return {
        "callback_file_offset": tail_offset,
        "callback_va": tail_va,
        "exit_process_iat_va": exit_iat_va,
    }


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def patch(source: Path, destination: Path) -> None:
    hook = load_hook_module()
    data = bytearray(source.read_bytes())
    hook.patch_region(
        data,
        hook.DIALOGUE_PATCH_VA,
        (hook.DIALOGUE_ORIGINAL, hook.cumulative_dialogue_hook()),
        hook.dialogue_hook(),
        "exact-line dialogue logger",
    )
    hook.patch_region(
        data,
        hook.CHOICE_PATCH_VA,
        hook.CHOICE_ORIGINAL,
        hook.choice_hook(),
        "choice logger",
    )
    patch_language_switch(data)
    patch_tips_close_fallback(data)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    patch(args.source.resolve(), args.destination.resolve())
    print(f"{sha256(args.destination.resolve())}  {args.destination.resolve()}")


if __name__ == "__main__":
    main()
