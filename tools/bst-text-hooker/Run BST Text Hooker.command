#!/bin/zsh
set -e
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$HOOK_DIR"
exec /usr/bin/python3 bst_text_hooker.py "$@"
