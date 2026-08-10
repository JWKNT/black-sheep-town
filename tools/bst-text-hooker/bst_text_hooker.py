#!/usr/bin/env python3
"""External text hook for BLACK SHEEP TOWN's IL2CPP/UTAGE player."""

from __future__ import annotations

import argparse
import json
import platform
import re
import signal
import subprocess
import sys
import threading
import time
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_PROCESS_NAMES = ("BSTGame.exe", "BstPlayer.exe", "Bst.exe")
RUBY_RE = re.compile(r"<ruby=[^>]*>(.*?)</ruby>", re.DOTALL | re.IGNORECASE)
HTML_RE = re.compile(r"</?(?:b|i|u|size|color|font)(?:=[^>]*)?>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
UTAGE_BREAK_RE = re.compile(r"\[(?:r|l|p)\]", re.IGNORECASE)
LEADING_UTAGE_BREAK_RE = re.compile(r"^(?:\s|\[(?:r|l|p)\])+", re.IGNORECASE)


def clean_text(value: str) -> str:
    """Remove display markup without altering the actual Japanese wording."""
    previous = None
    while previous != value:
        previous = value
        value = RUBY_RE.sub(r"\1", value)
    value = HTML_RE.sub("", value)
    value = TAG_RE.sub("", value)
    value = UTAGE_BREAK_RE.sub("\n", value)
    return value.replace("\r\n", "\n").replace("\r", "\n").strip()


def latest_progressed_text(previous: str, current: str) -> str:
    """Extract only the newest entry from UTAGE's cumulative page text."""
    if not current or current == previous:
        return ""
    appended = (
        current[len(previous):]
        if previous and current.startswith(previous)
        else current
    )
    entries = UTAGE_BREAK_RE.split(appended)
    newest = next((entry for entry in reversed(entries) if entry.strip()), "")
    return LEADING_UTAGE_BREAK_RE.sub("", newest).strip()


def copy_to_clipboard(value: str) -> None:
    if platform.system() == "Darwin":
        command = ["pbcopy"]
    elif platform.system() == "Windows":
        command = ["clip"]
    else:
        command = ["xclip", "-selection", "clipboard"]
    try:
        subprocess.run(command, input=value, text=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass


@dataclass
class Output:
    clipboard: bool
    raw: bool
    json_only: bool
    history: Path | None
    last: tuple[str, str, str, str] | None = None
    dialogue_page: str = ""

    def text(self, payload: dict[str, Any]) -> None:
        kind = str(payload.get("kind", "dialogue"))
        speaker = str(payload.get("speaker", ""))
        text = str(payload.get("text", ""))
        scenario = str(payload.get("scenario", ""))
        if kind == "dialogue" and bool(payload.get("cumulative", False)):
            page_text = text
            text = latest_progressed_text(self.dialogue_page, page_text)
            self.dialogue_page = page_text
        elif kind == "dialogue":
            self.dialogue_page = ""
        if not self.raw:
            speaker = clean_text(speaker)
            text = clean_text(text)
        record = (kind, speaker, text, scenario)
        if not text or (kind != "dialogue" and record == self.last):
            return
        self.last = record

        serialized = json.dumps(
            {"kind": kind, "speaker": speaker, "text": text, "scenario": scenario},
            ensure_ascii=False,
        )
        if self.json_only:
            print(serialized, flush=True)
        else:
            heading = "CHOICE" if kind == "choice" else (speaker or "NARRATION")
            print(f"\n[{heading}]\n{text}", flush=True)
        if self.clipboard:
            copy_to_clipboard(text)
        if self.history:
            self.history.parent.mkdir(parents=True, exist_ok=True)
            with self.history.open("a", encoding="utf-8") as stream:
                stream.write(serialized + "\n")


def find_process(
    device: Any, process_names: str | Sequence[str], wait_seconds: float
) -> int:
    names = (process_names,) if isinstance(process_names, str) else tuple(process_names)
    folded_names = tuple(name.casefold() for name in names)
    deadline = time.monotonic() + max(0.0, wait_seconds)
    announced = False
    while True:
        matches = [
            process
            for process in device.enumerate_processes()
            if any(
                process.name.casefold() == name
                or process.name.casefold().endswith("/" + name)
                or process.name.casefold().endswith("\\" + name)
                for name in folded_names
            )
        ]
        if matches:
            return max(matches, key=lambda process: process.pid).pid
        if time.monotonic() >= deadline:
            raise RuntimeError(
                "Could not find " + " or ".join(repr(name) for name in names)
            )
        if not announced:
            print(f"Waiting for {' or '.join(names)}…", flush=True)
            announced = True
        time.sleep(0.5)


def self_test() -> None:
    sample = '<ruby=ひつじ>羊</ruby>[r]<color=red>黒い</color>'
    assert clean_text(sample) == "羊\n黒い"
    assert clean_text("普通の文章") == "普通の文章"
    assert latest_progressed_text("", "最初[r]の行") == "の行"
    assert latest_progressed_text("最初", "最初[l]次の行") == "次の行"
    assert latest_progressed_text("最初", "最初[r]続き[l]最新") == "最新"
    assert latest_progressed_text("同じ", "同じ") == ""
    assert latest_progressed_text("前のページ", "新しいページ") == "新しいページ"
    dialogue = parse_unity_log_record([
        "誰もが、ここからいなくなる。",
        "UnityEngine.DebugLogHandler:Internal_Log(LogType, LogOption, String, Object)",
        "UnityEngine.Debug:Log(Object)",
        "Utage.AdvPage:UpdatePageTextData()",
    ])
    assert dialogue == {
        "kind": "dialogue",
        "speaker": "",
        "text": "誰もが、ここからいなくなる。",
        "scenario": "",
        "cumulative": False,
    }
    choice = parse_unity_log_record([
        "進む",
        "UnityEngine.DebugLogHandler:Internal_Log(LogType, LogOption, String, Object)",
        "UnityEngine.Debug:Log(Object)",
        "Utage.AdvSelectionManager:AddSelection(String)",
    ])
    assert choice == {
        "kind": "choice",
        "speaker": "",
        "text": "進む",
        "scenario": "",
        "cumulative": False,
    }
    assert parse_unity_log_record([
        "BloodEffects Save:True",
        "UnityEngine.DebugLogHandler:Internal_Log(LogType, LogOption, String, Object)",
        "Utage.AdvConfigSaveData:Write(BinaryReader)",
    ]) is None
    print("BST Text Hooker self-test passed")


def parse_unity_log_record(lines: list[str]) -> dict[str, Any] | None:
    """Return only records emitted by BST's two patched text call sites."""
    stack_start = next(
        (index for index, item in enumerate(lines)
         if item.startswith("UnityEngine.DebugLogHandler:")),
        -1,
    )
    if stack_start < 0:
        return None
    stack = lines[stack_start:]
    is_dialogue = any("Utage.AdvPage:UpdatePageTextData" in item for item in stack)
    is_choice = any("Utage.AdvSelectionManager:AddSelection" in item for item in stack)
    if not (is_dialogue or is_choice):
        return None
    message = "\n".join(lines[:stack_start]).strip()
    return {
        "kind": "choice" if is_choice else "dialogue",
        "speaker": "",
        "text": message,
        "scenario": "",
        "cumulative": False,
    }


def default_player_logs() -> list[Path]:
    home = Path.home()
    bottles = home / "Library/Application Support/CrossOver/Bottles"
    return list(bottles.glob(
        "*/drive_c/users/crossover/AppData/LocalLow/MoralityLine/Bst/Player.log"
    ))


def select_player_log(explicit: Path | None, wait_seconds: float) -> Path:
    deadline = time.monotonic() + max(0.0, wait_seconds)
    announced = False
    while True:
        candidates = [explicit.expanduser()] if explicit else default_player_logs()
        existing = [path for path in candidates if path.is_file()]
        if existing:
            return max(existing, key=lambda path: path.stat().st_mtime_ns)
        if time.monotonic() >= deadline:
            wanted = str(explicit) if explicit else "CrossOver's BST Player.log"
            raise RuntimeError(f"Could not find {wanted}")
        if not announced:
            print("Waiting for BST's Unity log…", flush=True)
            announced = True
        time.sleep(0.5)


def run_log_hook(args: argparse.Namespace, output: Output) -> int:
    log = select_player_log(args.log, args.wait)
    print(f"Following {log}", flush=True)
    print("Hook active. Advance the game normally; press Ctrl-C to stop.", flush=True)
    stopped = threading.Event()

    def stop(_signum: int, _frame: Any) -> None:
        stopped.set()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    stream = None
    identity: tuple[int, int] | None = None
    lines: list[str] = []
    try:
        while not stopped.is_set():
            try:
                stat = log.stat()
            except FileNotFoundError:
                time.sleep(0.2)
                continue
            current_identity = (stat.st_dev, stat.st_ino)
            if stream is None or identity != current_identity or stat.st_size < stream.tell():
                if stream is not None:
                    stream.close()
                stream = log.open("r", encoding="utf-8", errors="replace")
                stream.seek(0, 2)
                identity = current_identity
                lines.clear()
            line = stream.readline()
            if not line:
                time.sleep(0.05)
                continue
            value = line.rstrip("\r\n")
            if value.startswith("(Filename:"):
                payload = parse_unity_log_record(lines)
                if payload is not None:
                    output.text(payload)
                lines.clear()
            else:
                lines.append(value)
                if len(lines) > 500:
                    lines = lines[-500:]
    finally:
        if stream is not None:
            stream.close()
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Hook dialogue and choices from the Japanese BLACK SHEEP TOWN release."
    )
    parser.add_argument(
        "--process", action="append", metavar="NAME",
        help=(
            "Frida process name; may be repeated "
            "(default: auto-detect BSTGame.exe, BstPlayer.exe, or Bst.exe)"
        ),
    )
    parser.add_argument("--pid", type=int, help="attach to an exact process ID")
    parser.add_argument(
        "--wait", type=float, default=90.0, metavar="SECONDS",
        help="time to wait for the game process (default: 90)",
    )
    parser.add_argument("--no-clipboard", action="store_true", help="do not copy each line")
    parser.add_argument("--history", type=Path, help="append extracted lines as JSONL")
    parser.add_argument("--json", action="store_true", help="print JSONL instead of readable text")
    parser.add_argument("--raw", action="store_true", help="retain UTAGE display tags")
    parser.add_argument("--log", type=Path, help="override CrossOver Player.log path")
    parser.add_argument("--frida", action="store_true", help="force the legacy injection hook")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        self_test()
        return 0

    output = Output(
        clipboard=not args.no_clipboard,
        raw=args.raw,
        json_only=args.json,
        history=args.history,
    )
    if platform.system() == "Darwin" and not args.frida:
        return run_log_hook(args, output)

    try:
        import frida
    except ImportError:
        print(
            "Frida is not installed. Run the supplied launcher or "
            "`python -m pip install -r requirements.txt`.",
            file=sys.stderr,
        )
        return 2

    device = frida.get_local_device()
    pid = args.pid or find_process(
        device, args.process or DEFAULT_PROCESS_NAMES, args.wait
    )
    print(f"Attaching to PID {pid}…", flush=True)
    session = device.attach(pid)
    script = session.create_script((ROOT / "agent.js").read_text(encoding="utf-8"))
    stopped = threading.Event()

    def on_message(message: dict[str, Any], data: bytes | None) -> None:
        del data
        if message.get("type") == "error":
            print(message.get("stack") or message, file=sys.stderr, flush=True)
            return
        payload = message.get("payload", {})
        message_type = payload.get("type")
        if message_type == "bst-text":
            output.text(payload)
        elif message_type == "bst-status":
            print(payload.get("message", ""), flush=True)
        elif message_type == "bst-error":
            print("Hook error: " + payload.get("message", "unknown error"), file=sys.stderr)

    def on_detached(reason: str, crash: Any) -> None:
        del crash
        print(f"Game detached: {reason}", flush=True)
        stopped.set()

    script.on("message", on_message)
    session.on("detached", on_detached)
    script.load()

    def stop(_signum: int, _frame: Any) -> None:
        stopped.set()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    print("Hook active. Advance the game normally; press Ctrl-C to stop.", flush=True)
    stopped.wait()
    try:
        script.unload()
        session.detach()
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
