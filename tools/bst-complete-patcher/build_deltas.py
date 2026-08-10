#!/usr/bin/env python3
"""Maintainer utility: generate redistributable patches from verified builds."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from delta_codec import create_delta


FILES = {
    "english-level0": ("Bst_Data/level0", "BstPlayer_Data/level0"),
    "english-sharedassets0": ("Bst_Data/sharedassets0.assets", "BstPlayer_Data/sharedassets0.assets"),
    "english-resources-assets": ("Bst_Data/resources.assets", "BstPlayer_Data/resources.assets"),
    "english-resources-resource": ("Bst_Data/resources.resource", "BstPlayer_Data/resources.resource"),
    "english-global-metadata": (
        "Bst_Data/il2cpp_data/Metadata/global-metadata.dat",
        "BstPlayer_Data/il2cpp_data/Metadata/global-metadata.dat",
    ),
    "patched-game-assembly": ("GameAssembly.dll", "GameAssembly.dll"),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("japanese", type=Path)
    parser.add_argument("current", type=Path)
    parser.add_argument("--pristine-assembly", type=Path)
    parser.add_argument("--existing-hook-assembly", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("payload"))
    args = parser.parse_args()
    japanese = args.japanese.resolve()
    current = args.current.resolve()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)

    report = {}
    for name, (source_rel, target_rel) in FILES.items():
        source = (
            args.pristine_assembly.resolve()
            if name == "patched-game-assembly" and args.pristine_assembly
            else japanese / source_rel
        )
        target = current / target_rel
        destination = output / name
        if destination.exists():
            shutil.rmtree(destination)
        report[name] = create_delta(source, target, destination)

    # The Japanese pack differs from a clean install only in level0: it adds
    # the visible language button and the portrait-safe dialogue geometry.
    destination = output / "japanese-level0"
    if destination.exists():
        shutil.rmtree(destination)
    report["japanese-level0"] = create_delta(
        japanese / "Bst_Data/level0",
        current / "BSTLanguage/ja/Bst_Data/level0",
        destination,
    )
    if args.existing_hook_assembly:
        destination = output / "patched-game-assembly-existing-hook"
        if destination.exists():
            shutil.rmtree(destination)
        report["patched-game-assembly-existing-hook"] = create_delta(
            args.existing_hook_assembly.resolve(),
            current / "GameAssembly.dll",
            destination,
        )
    (output / "build-report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
