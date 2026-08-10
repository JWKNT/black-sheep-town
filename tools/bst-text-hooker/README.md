# BLACK SHEEP TOWN Text Hooker

A game-specific text hook for the original Japanese Windows release of
*BLACK SHEEP TOWN*. Generic text hookers miss this game because its UTAGE text
is produced inside an IL2CPP Unity player rather than through the usual Windows
text-rendering APIs.

The macOS hook follows a small, game-side Unity log channel installed for BST.
It does not inject into CrossOver (macOS blocks that attachment). It captures:

- the most recently progressed dialogue or narration entry (not the whole page);
- selection text.

Version 1.0.2 reads the current `AdvCommandText` directly. Earlier builds read
UTAGE's aggregate page buffer, which could send a whole page to the hooker at
once. Re-run `install_game_hook.py`, or update to complete patcher 1.0.4, before
using the macOS log backend.

## Install the game hook

Make a backup of the game, close it completely, and run this once from the
tool folder:

```sh
python3 install_game_hook.py "/path/to/BLACK SHEEP TOWN"
```

The installer validates the expected BST instructions before changing
`GameAssembly.dll`, creates `GameAssembly.dll.pre-bst-text-hook`, and is safe
to run again. It does not include or download any game data.

## macOS / CrossOver

1. Install the game hook once, unless your build is already patched.
2. Start the game and reach the title screen.
3. Double-click `Run BST Text Hooker.command` before advancing the story.
4. Advance normally. Each new line appears in Terminal and is copied
   to the clipboard.

No Python packages or macOS Developer Tools permission are required.

Do not install BepInEx for this hooker. Its IL2CPP delegate bridge crashes this
Unity build under CrossOver; the BST log patch replaces it completely. If an
older test installed BepInEx, disable its `winhttp.dll` proxy before launching
the game.

## Windows

Start the Japanese game, then double-click `Run BST Text Hooker.bat`. Python 3
must be installed. Run the launcher at the same privilege level as the game.

## Useful options

Pass options to either launcher after its filename:

```text
--no-clipboard              print only
--history bst-lines.jsonl   append a machine-readable history
--json                      print JSONL
--raw                       keep UTAGE display tags
--pid 1234                  attach to a specific process
--process OtherName.exe     override automatic BSTGame.exe / BstPlayer.exe / Bst.exe detection
--wait 180                  wait longer for the game
--log /path/to/Player.log   override automatic CrossOver-log discovery
--frida                     use the legacy injection backend
```

The companion reads only newly appended exact-line records from Unity's
`Player.log`.
On CrossOver it automatically follows the newest BST log under the active
bottle. On Windows the Frida backend detects the patcher's `BSTGame.exe` as
well as legacy `BstPlayer.exe` and `Bst.exe` processes. Use `--log` when
several BST bottles are running at once.
