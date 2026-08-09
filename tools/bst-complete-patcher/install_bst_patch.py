#!/usr/bin/env python3
"""Install or restore the complete BLACK SHEEP TOWN English/JP build."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import time
from pathlib import Path

from delta_codec import apply_delta, sha256


PATCHER = Path(__file__).resolve().parent
PAYLOAD = PATCHER / "payload"
ORIGINAL_PLAYER_SHA256 = "3c0e2eb91c2dcd5e52c6c21f38c8483a72eef45b670b32c3aa28bd7b73ea69b0"
LAUNCHER_SHA256 = "9fd1c632581a0da899ce527e020453ac4c1f25cf1a597410e4f2e0e86bd852c0"
PACK_FILES = (
    "level0",
    "sharedassets0.assets",
    "resources.assets",
    "resources.resource",
)
ENGLISH_PATCHES = {
    "level0": "english-level0",
    "sharedassets0.assets": "english-sharedassets0",
    "resources.assets": "english-resources-assets",
    "resources.resource": "english-resources-resource",
}
METADATA_RELATIVE = Path("il2cpp_data/Metadata/global-metadata.dat")


def normalized_game_path(value: str | Path) -> Path:
    path = Path(value).expanduser().resolve()
    if path.is_file():
        path = path.parent
    return path


def discover_game(argument: Path | None) -> Path:
    if argument is not None:
        return normalized_game_path(argument)
    print("Drag the fresh BLACK SHEEP TOWN game folder here, then press Return:")
    value = input("> ").strip().strip('"').strip("'")
    if not value:
        raise ValueError("No game folder was supplied")
    return normalized_game_path(value)


def validate_fresh(game: Path) -> None:
    player = game / "Bst.exe"
    data = game / "Bst_Data"
    assembly = game / "GameAssembly.dll"
    if not player.is_file() or not data.is_dir() or not assembly.is_file():
        raise ValueError(
            f"{game} is not a fresh Windows BLACK SHEEP TOWN installation "
            "(Bst.exe, GameAssembly.dll, and Bst_Data are required)"
        )
    if sha256(player) != ORIGINAL_PLAYER_SHA256:
        raise ValueError("Bst.exe does not match the supported Japanese release")
    if (game / "BstPlayer_Data").exists() or (game / "BSTLanguage").exists():
        raise ValueError("This folder already contains the bilingual runtime")


def copy_verified(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    if sha256(source) != sha256(destination):
        raise IOError(f"Copy verification failed: {destination}")


def build_staging(game: Path, staging: Path) -> dict[str, object]:
    source_data = game / "Bst_Data"
    language = staging / "BSTLanguage"
    english = language / "en/Bst_Data"
    japanese = language / "ja/Bst_Data"
    backup = language / "backup"
    english.mkdir(parents=True)
    japanese.mkdir(parents=True)
    backup.mkdir(parents=True)

    results: dict[str, object] = {}
    for filename, patch_name in ENGLISH_PATCHES.items():
        print(f"  Rebuilding English {filename}...")
        results[patch_name] = apply_delta(
            source_data / filename,
            PAYLOAD / patch_name,
            english / filename,
        )

    print("  Rebuilding Japanese language-button scene...")
    results["japanese-level0"] = apply_delta(
        source_data / "level0",
        PAYLOAD / "japanese-level0",
        japanese / "level0",
    )
    for filename in PACK_FILES[1:]:
        copy_verified(source_data / filename, japanese / filename)

    print("  Rebuilding native runtime hooks...")
    results["patched-game-assembly"] = apply_delta(
        game / "GameAssembly.dll",
        PAYLOAD / "patched-game-assembly",
        staging / "GameAssembly.dll",
    )
    print("  Rebuilding localized runtime metadata...")
    results["english-global-metadata"] = apply_delta(
        source_data / METADATA_RELATIVE,
        PAYLOAD / "english-global-metadata",
        staging / "global-metadata.dat",
    )

    launcher = PAYLOAD / "BstPackLauncher.exe"
    if sha256(launcher) != LAUNCHER_SHA256:
        raise ValueError("The language launcher payload is corrupt")
    copy_verified(game / "GameAssembly.dll", backup / "GameAssembly.dll.original")
    copy_verified(source_data / METADATA_RELATIVE, backup / "global-metadata.dat.original")
    copy_verified(source_data / "level0", backup / "level0.original")
    (language / "current.txt").write_text("en\n", encoding="ascii")
    return results


def rollback_partial(game: Path) -> None:
    language = game / "BSTLanguage"
    player_data = game / "BstPlayer_Data"
    legacy_data = game / "Bst_Data"
    try:
        if language.is_dir() and player_data.is_dir():
            original_level = language / "backup/level0.original"
            original_metadata = language / "backup/global-metadata.dat.original"
            if original_level.is_file():
                shutil.copy2(original_level, player_data / "level0")
            if original_metadata.is_file():
                shutil.copy2(original_metadata, player_data / METADATA_RELATIVE)
        original_assembly = language / "backup/GameAssembly.dll.original"
        if original_assembly.is_file():
            shutil.copy2(original_assembly, game / "GameAssembly.dll")
        original_player = game / "BstPlayer.exe"
        if original_player.is_file():
            shutil.copy2(original_player, game / "Bst.exe")
        if player_data.is_dir() and not legacy_data.exists():
            player_data.rename(legacy_data)
    except Exception as error:
        print(f"WARNING: automatic rollback also encountered an error: {error}", file=sys.stderr)


def install(game: Path) -> dict[str, object]:
    validate_fresh(game)
    staging = game / ".bst-patcher-staging"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir()
    committed = False
    try:
        print("Building and verifying the complete patch (the large assets take a moment)...")
        results = build_staging(game, staging)
        data = game / "Bst_Data"
        player_data = game / "BstPlayer_Data"
        language = game / "BSTLanguage"

        print("Installing the verified bilingual runtime...")
        shutil.copy2(game / "Bst.exe", game / "BstPlayer.exe")
        data.rename(player_data)
        (staging / "BSTLanguage").rename(language)
        for filename in PACK_FILES:
            shutil.copy2(language / "en/Bst_Data" / filename, player_data / filename)
        shutil.copy2(staging / "global-metadata.dat", player_data / METADATA_RELATIVE)
        shutil.copy2(staging / "GameAssembly.dll", game / "GameAssembly.dll")
        shutil.copy2(PAYLOAD / "BstPackLauncher.exe", game / "Bst.exe")
        committed = True

        report = {
            "format": "bst-complete-patch-v1",
            "installed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "game": str(game),
            "current_language": "en",
            "text_hook": "Unity Player.log dialogue and choices",
            "files": {
                "launcher": sha256(game / "Bst.exe"),
                "player": sha256(game / "BstPlayer.exe"),
                "assembly": sha256(game / "GameAssembly.dll"),
                "metadata": sha256(player_data / METADATA_RELATIVE),
                "english_pack": {
                    name: sha256(language / "en/Bst_Data" / name) for name in PACK_FILES
                },
                "japanese_pack": {
                    name: sha256(language / "ja/Bst_Data" / name) for name in PACK_FILES
                },
            },
            "delta_targets": {
                name: details["target_sha256"] for name, details in results.items()
            },
        }
        (language / "install-report.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8"
        )
        return report
    except Exception:
        if not committed:
            rollback_partial(game)
        raise
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def restore(game: Path) -> Path:
    language = game / "BSTLanguage"
    player_data = game / "BstPlayer_Data"
    if not language.is_dir() or not player_data.is_dir() or not (game / "BstPlayer.exe").is_file():
        raise ValueError("This does not look like a patcher-installed bilingual build")
    backup = language / "backup"
    for required in (
        backup / "GameAssembly.dll.original",
        backup / "global-metadata.dat.original",
        backup / "level0.original",
    ):
        if not required.is_file():
            raise ValueError(f"Rollback backup is missing: {required}")

    print("Restoring the verified Japanese runtime...")
    shutil.copy2(backup / "level0.original", player_data / "level0")
    for filename in PACK_FILES[1:]:
        shutil.copy2(language / "ja/Bst_Data" / filename, player_data / filename)
    shutil.copy2(backup / "global-metadata.dat.original", player_data / METADATA_RELATIVE)
    shutil.copy2(backup / "GameAssembly.dll.original", game / "GameAssembly.dll")
    shutil.copy2(game / "BstPlayer.exe", game / "Bst.exe")
    restored_data = game / "Bst_Data"
    if restored_data.exists():
        raise ValueError(f"Cannot restore while {restored_data} already exists")
    player_data.rename(restored_data)

    archive = game / "BSTLanguage.patcher-backup"
    if archive.exists():
        archive = game / f"BSTLanguage.patcher-backup-{int(time.time())}"
    language.rename(archive)
    return archive


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Install the complete BST English/JP fan-translation patch"
    )
    parser.add_argument("game", type=Path, nargs="?", help="fresh folder containing Bst.exe")
    parser.add_argument("--restore", action="store_true", help="restore the Japanese layout")
    args = parser.parse_args()
    game = discover_game(args.game)
    if args.restore:
        archive = restore(game)
        print(f"\nJapanese game restored. Patch files were retained at:\n{archive}")
    else:
        report = install(game)
        print("\nPatch installed successfully.")
        print(f"Launch: {game / 'Bst.exe'}")
        print("Use the EN/JP control in Settings to swap complete language packs immediately.")
        print(f"Install report: {game / 'BSTLanguage/install-report.json'}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"\nERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
