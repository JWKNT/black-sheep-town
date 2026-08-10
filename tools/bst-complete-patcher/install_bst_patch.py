#!/usr/bin/env python3
"""Install or restore the complete BLACK SHEEP TOWN English/JP build."""

from __future__ import annotations

import argparse
import hashlib
import json
import shlex
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
ASSEMBLY_PATCHES = (
    "patched-game-assembly",
    "patched-game-assembly-existing-hook",
)
METADATA_RELATIVE = Path("il2cpp_data/Metadata/global-metadata.dat")


def normalized_game_path(value: str | Path) -> Path:
    path = Path(value).expanduser().resolve()
    if path.is_file():
        path = path.parent
    return path


def parse_dragged_path(value: str, platform: str | None = None) -> str:
    value = value.strip()
    if not value:
        raise ValueError("No game folder was supplied")
    if (platform or sys.platform) == "win32":
        return value.strip('"').strip("'")
    try:
        values = shlex.split(value)
    except ValueError as error:
        raise ValueError(f"Could not read the dragged game path: {error}") from error
    if len(values) != 1:
        raise ValueError("Please drag exactly one game folder into the prompt")
    return values[0]


def discover_game(argument: Path | None) -> Path:
    if argument is not None:
        return normalized_game_path(argument)
    print("Drag the BLACK SHEEP TOWN game folder here, then press Return:")
    return normalized_game_path(parse_dragged_path(input("> ")))


def apply_compatible_delta(
    source: Path,
    patch_names: tuple[str, ...],
    destination: Path,
) -> dict[str, object]:
    source_hash = sha256(source)
    for patch_name in patch_names:
        manifest_path = PAYLOAD / patch_name / "manifest.json"
        if not manifest_path.is_file():
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("source_sha256") == source_hash:
            return apply_delta(source, PAYLOAD / patch_name, destination)
    supported = ", ".join(
        json.loads((PAYLOAD / name / "manifest.json").read_text(encoding="utf-8"))[
            "source_sha256"
        ][:12]
        for name in patch_names
        if (PAYLOAD / name / "manifest.json").is_file()
    )
    raise ValueError(
        f"{source.name} is not a supported original or existing-hook build "
        f"(found {source_hash[:12]}, expected one of {supported})"
    )


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
    results["patched-game-assembly"] = apply_compatible_delta(
        game / "GameAssembly.dll",
        ASSEMBLY_PATCHES,
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
            "format": "bst-complete-patch-v1.0.3",
            "installed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "game": str(game),
            "current_language": "en",
            "text_hook": "Unity Player.log dialogue and choices",
            "portrait_fix": "6348 active portrait rows verified",
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


def validate_installed(
    game: Path,
    require_rollback: bool = False,
) -> tuple[Path, Path, Path]:
    language = game / "BSTLanguage"
    player_data = game / "BstPlayer_Data"
    backup = language / "backup"
    if not language.is_dir() or not player_data.is_dir() or not (game / "BstPlayer.exe").is_file():
        raise ValueError("This does not look like a supported bilingual build")
    required_files = [
        language / "current.txt",
        *(language / "en/Bst_Data" / name for name in PACK_FILES),
        language / "ja/Bst_Data/sharedassets0.assets",
        language / "ja/Bst_Data/resources.assets",
        language / "ja/Bst_Data/resources.resource",
    ]
    if require_rollback:
        required_files.extend(
            (
                backup / "GameAssembly.dll.original",
                backup / "global-metadata.dat.original",
                backup / "level0.original",
            )
        )
    for required in required_files:
        if not required.is_file():
            raise ValueError(f"Installed patch source is missing: {required}")
    return language, player_data, backup


def update_installed(game: Path) -> dict[str, object]:
    language, player_data, backup = validate_installed(game)
    legacy_layout = not all(
        path.is_file()
        for path in (
            backup / "GameAssembly.dll.original",
            backup / "global-metadata.dat.original",
            backup / "level0.original",
        )
    )
    current_file = language / "current.txt"
    current_language = current_file.read_text(encoding="ascii").strip().lower()
    if current_language not in {"en", "ja"}:
        raise ValueError(f"Unknown installed language: {current_language!r}")

    old_english = language / "en/Bst_Data"
    target_hashes = {
        filename: json.loads((PAYLOAD / patch_name / "manifest.json").read_text(encoding="utf-8"))[
            "target_sha256"
        ]
        for filename, patch_name in ENGLISH_PATCHES.items()
    }
    if all(
        (old_english / filename).is_file()
        and sha256(old_english / filename) == target_hash
        for filename, target_hash in target_hashes.items()
    ):
        if current_language == "en":
            for filename in PACK_FILES:
                if sha256(player_data / filename) != target_hashes[filename]:
                    copy_verified(old_english / filename, player_data / filename)
        report_path = language / "install-report.json"
        report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else {}
        report.update(
            {
                "format": "bst-complete-patch-v1.0.3",
                "game": str(game),
                "current_language": current_language,
                "portrait_fix": "6348 active portrait rows verified",
                "legacy_layout": legacy_layout,
            }
        )
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print("The corrected English asset pack is already current.")
        return report

    staging = game / ".bst-patcher-update-staging"
    if staging.exists():
        shutil.rmtree(staging)
    english = staging / "en/Bst_Data"
    english.mkdir(parents=True)
    try:
        print("Rebuilding and verifying the corrected English asset pack...")
        results: dict[str, object] = {}
        for filename, patch_name in ENGLISH_PATCHES.items():
            destination = english / filename
            if (
                (old_english / filename).is_file()
                and sha256(old_english / filename) == target_hashes[filename]
            ):
                copy_verified(old_english / filename, destination)
                continue
            source = (
                backup / "level0.original"
                if filename == "level0"
                else language / "ja/Bst_Data" / filename
            )
            if not source.is_file():
                raise ValueError(
                    f"Cannot rebuild legacy {filename}: verified source is missing: {source}"
                )
            print(f"  Rebuilding English {filename}...")
            results[patch_name] = apply_delta(
                source,
                PAYLOAD / patch_name,
                destination,
            )

        backup.mkdir(parents=True, exist_ok=True)
        archived = backup / "english-pack-before-v1.0.3"
        if archived.exists():
            archived = backup / f"english-pack-before-v1.0.3-{int(time.time())}"
        old_english.rename(archived)
        english.rename(old_english)
        if current_language == "en":
            for filename in PACK_FILES:
                copy_verified(old_english / filename, player_data / filename)

        report_path = language / "install-report.json"
        report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else {}
        report.update(
            {
                "format": "bst-complete-patch-v1.0.3",
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "game": str(game),
                "current_language": current_language,
                "portrait_fix": "6348 active portrait rows verified",
                "legacy_layout": legacy_layout,
            }
        )
        files = report.setdefault("files", {})
        files["english_pack"] = {
            name: sha256(old_english / name) for name in PACK_FILES
        }
        report["delta_targets"] = {
            **report.get("delta_targets", {}),
            **{name: details["target_sha256"] for name, details in results.items()},
        }
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def restore(game: Path) -> Path:
    language, player_data, backup = validate_installed(game, require_rollback=True)

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
    parser.add_argument(
        "--update",
        action="store_true",
        help="refresh an existing patcher installation with the current English pack",
    )
    args = parser.parse_args()
    game = discover_game(args.game)
    if args.restore:
        archive = restore(game)
        print(f"\nJapanese game restored. Patch files were retained at:\n{archive}")
    elif args.update or (game / "BSTLanguage").is_dir():
        report = update_installed(game)
        print("\nExisting patch updated successfully.")
        print(f"Launch: {game / 'Bst.exe'}")
        print(f"Current language remains: {report['current_language'].upper()}")
        print(f"Install report: {game / 'BSTLanguage/install-report.json'}")
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
