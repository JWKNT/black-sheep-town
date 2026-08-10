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


def immediate_exit_patch() -> bytes:
    # push 42; pop rcx; call [ExitProcess]; nop; original function epilogue.
    call_va = LANGUAGE_EXIT_VA + 3
    relative = EXIT_PROCESS_IAT_VA - (call_va + 6)
    return (
        bytes.fromhex("6a 2a 59 ff 15")
        + struct.pack("<i", relative)
        + b"\x90"
        + bytes.fromhex("48 81 c4 d0 00 00 00 5f c3")
    )


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
    hook.patch_region(
        data,
        LANGUAGE_EXIT_VA,
        (LANGUAGE_EXIT_ORIGINAL, LANGUAGE_EXIT_DEFERRED),
        immediate_exit_patch(),
        "language-switch exit",
    )
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
