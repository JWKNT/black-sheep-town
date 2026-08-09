# Complete English/JP game patcher

This patcher converts a fresh Windows installation of *BLACK SHEEP TOWN* into
the current fan-translation build. It installs:

- the final English script, glossary, menus, and localized images;
- the portrait-safe English text layout;
- complete English and Japanese asset packs;
- the immediate EN/JP control in Settings;
- the native Player.log hook used by the BST text-hooker.

The repository contains binary differences, not the original game. You must
own the Japanese Windows release. The installer verifies the source release
and every rebuilt file before modifying the game.

## One-click installation

1. Download this entire `bst-complete-patcher` folder (the `payload` folder is
   required).
2. Start with a fresh Japanese game folder containing `Bst.exe`,
   `GameAssembly.dll`, and `Bst_Data`.
3. On macOS/CrossOver, double-click **Install BST English Patch.command**. On
   Windows, double-click **Install BST English Patch.bat**.
4. Drag the fresh game folder into the terminal window when prompted and press
   Return. You can also drag the folder onto the launcher itself.

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
