# Complete English/JP game patcher

This patcher converts a fresh Windows installation of *BLACK SHEEP TOWN* into
the current fan-translation build. It installs:

- the final English script, glossary, menus, and localized images;
- the portrait-safe English text layout;
- complete English and Japanese asset packs;
- the immediate EN/JP control in Settings;
- the native Player.log hook used by the BST text-hooker.

Version 1.0.1 corrected the internal character-name keys used by UTAGE, restoring
portraits throughout the English script while keeping the visible English
speaker names. All 6,348 active portrait-bearing rows are checked against the
game's Character table.

Version 1.0.2 accepts shell-escaped paths produced when a game folder is
dragged into macOS Terminal. It also recognizes the supported Japanese layout
when the BST game-side text logger has already been installed.

Version 1.0.3 recognizes legacy bilingual builds created before the public
patcher added its rollback-backup directory. It can verify an already-current
pack or selectively rebuild changed English assets from the retained Japanese
pack. Full `--restore` remains available only when the original rollback files
exist.

Version 1.0.4 changes the hook from UTAGE's cumulative page buffer to the exact
text command advanced on each click. It also makes the Settings language button
exit with an immediate native `ExitProcess(42)` request, so the launcher sees
and restarts EN/JP switches reliably on Windows as well as CrossOver. Running
1.0.4 over an existing install updates these native fixes in place.

Version 1.0.5 removes two storefront-specific assumptions. Both `Bst.exe` and
the legacy `BstPlayer.exe` entry point now pass through the pack launcher, while
the internal Unity player runs as `BSTGame.exe`; Steam and direct shortcuts can
therefore no longer bypass the restart handoff. The native patcher also locates
`SystemUiDebugMenu.OnClickChangeLanguage` and the Windows `ExitProcess` import
from each binary instead of assuming the original release's fixed addresses.
Unknown layouts are rejected unless that callback is found exactly once.
Running 1.0.5 over an existing installation migrates it in place and preserves
the selected language.

Version 1.0.6 incorporates the final terminology, capitalization, grammar,
speaker-label, and UTAGE-tag audit. English pagination is now checked across
every numbered message window, including the alternate full-page layouts: all
30,759 compiled dialogue rows fit their page budgets, with portrait-bearing
pages retaining the stricter four-line limit. Running 1.0.6 over an existing
installation rebuilds only the changed English pack and preserves the selected
language.

The repository contains binary differences, not the original game. You must
own the Japanese Windows release. The translated asset deltas still require
compatible Japanese game data, but equivalent storefront/player executables
and native layouts may vary. Every rebuilt file is verified before the game is
modified.

## One-click installation

1. Download this entire `bst-complete-patcher` folder (the `payload` folder is
   required).
2. Use either a Japanese game folder containing `Bst.exe`, `GameAssembly.dll`,
   and `Bst_Data` (untouched or with the supported BST text logger), or a folder
   previously patched with an earlier public or legacy bilingual build.
3. On macOS/CrossOver, double-click **Install BST English Patch.command**. On
   Windows, double-click **Install BST English Patch.bat**.
4. Drag the game folder into the terminal window when prompted and press
   Return. You can also drag the folder onto the launcher itself.

For an existing patcher installation, running the same launcher automatically
updates the English asset pack in place. The selected EN/JP language is
preserved, and the replaced English pack is retained under
`BSTLanguage/backup`.

The rebuild needs roughly 1.7 GB of temporary/free space because both complete
language packs are retained. When it finishes, launch `Bst.exe`. The language
button in Settings swaps the entire running game and restarts the Unity player
immediately; saves are shared.

Python 3.9 or newer is the only patch-time requirement. No Unity editor,
BepInEx, .NET SDK, or external binary-patching tool is needed.

## Command line

```sh
python3 install_bst_patch.py "/path/to/BLACK SHEEP TOWN"
```

The installer auto-detects an existing bilingual installation. You may also
request that mode explicitly:

```sh
python3 install_bst_patch.py --update "/path/to/BLACK SHEEP TOWN"
```

To restore the original Japanese executable and data layout:

```sh
python3 install_bst_patch.py --restore "/path/to/BLACK SHEEP TOWN"
```

Rollback leaves the translation payload in a timestamped
`BSTLanguage.patcher-backup` folder so no large data is silently deleted.

## Text hooking after installation

Run the companion [BST text hooker](../bst-text-hooker/README.md). The complete
patch already contains its native dialogue/choice logging hook, so the hooker
only needs to watch Unity's `Player.log`.

## Maintainer notes

`build_deltas.py` reproduces the payload from a verified Japanese source and a
known-good current build. `delta_codec.py` uses content-defined chunks and a
split zlib literal stream. Each output is checked against its target SHA-256;
corrupt or unsupported inputs are rejected before installation.
