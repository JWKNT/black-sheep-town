#!/usr/bin/env python3
"""Maintainer utility: generate redistributable patches from verified builds."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from delta_codec import create_delta


FILES = {
    "english-level0": ("Bst_Data/level0", "BSTGame_Data/level0"),
    "english-sharedassets0": ("Bst_Data/sharedassets0.assets", "BSTGame_Data/sharedassets0.assets"),
    "english-resources-assets": ("Bst_Data/resources.assets", "BSTGame_Data/resources.assets"),
    "english-resources-resource": ("Bst_Data/resources.resource", "BSTGame_Data/resources.resource"),
    "english-global-metadata": (
        "Bst_Data/il2cpp_data/Metadata/global-metadata.dat",
        "BSTGame_Data/il2cpp_data/Metadata/global-metadata.dat",
    ),
    "patched-game-assembly": ("GameAssembly.dll", "GameAssembly.dll"),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_or_reuse_delta(source: Path, target: Path, destination: Path) -> dict:
    """Reuse a verified unchanged delta instead of rebuilding large payloads."""
    manifest = destination / "manifest.json"
    if manifest.is_file():
        existing = json.loads(manifest.read_text(encoding="utf-8"))
        if (
            existing.get("source_size") == source.stat().st_size
            and existing.get("target_size") == target.stat().st_size
            and existing.get("source_sha256") == sha256(source)
            and existing.get("target_sha256") == sha256(target)
        ):
            return existing
    if destination.exists():
        shutil.rmtree(destination)
    return create_delta(source, target, destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("japanese", type=Path)
    parser.add_argument("current", type=Path)
    parser.add_argument("--pristine-assembly", type=Path)
    parser.add_argument("--existing-hook-assembly", type=Path)
    parser.add_argument("--previous-patched-assembly", type=Path)
    parser.add_argument("--exact-hook-assembly", type=Path)
    parser.add_argument("--exact-hook-switch-assembly", type=Path)
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
        report[name] = create_or_reuse_delta(source, target, destination)

    # The Japanese pack differs from a clean install only in level0: it adds
    # the visible language button and the portrait-safe dialogue geometry.
    destination = output / "japanese-level0"
    report["japanese-level0"] = create_or_reuse_delta(
        japanese / "Bst_Data/level0",
        current / "BSTLanguage/ja/Bst_Data/level0",
        destination,
    )
    if args.existing_hook_assembly:
        destination = output / "patched-game-assembly-existing-hook"
        report["patched-game-assembly-existing-hook"] = create_or_reuse_delta(
            args.existing_hook_assembly.resolve(),
            current / "GameAssembly.dll",
            destination,
        )
    if args.previous_patched_assembly:
        destination = output / "patched-game-assembly-v1.0.3"
        report["patched-game-assembly-v1.0.3"] = create_or_reuse_delta(
            args.previous_patched_assembly.resolve(),
            current / "GameAssembly.dll",
            destination,
        )
    for name, source in (
        ("patched-game-assembly-exact-hook", args.exact_hook_assembly),
        ("patched-game-assembly-exact-hook-switch", args.exact_hook_switch_assembly),
    ):
        if source:
            destination = output / name
            report[name] = create_or_reuse_delta(
                source.resolve(),
                current / "GameAssembly.dll",
                destination,
            )

    # Optional native-layout deltas may already have been generated during a
    # previous compatibility pass. Keep them represented in the aggregate
    # report when this run only refreshes translated assets.
    for name in (
        "patched-game-assembly-existing-hook",
        "patched-game-assembly-v1.0.3",
        "patched-game-assembly-exact-hook",
        "patched-game-assembly-exact-hook-switch",
    ):
        manifest = output / name / "manifest.json"
        if name not in report and manifest.is_file():
            report[name] = json.loads(manifest.read_text(encoding="utf-8"))
    (output / "build-report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
