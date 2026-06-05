#!/usr/bin/env bash
# Decrypt secrets/dev.env (SOPS+age) -> .env at repo root.
# Works on any node: Windows (git-bash), node-auto host, Paperclip container.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Locate the age key: container persistent path first, then host default.
if [ -z "${SOPS_AGE_KEY_FILE:-}" ]; then
  if [ -f /paperclip/.config/sops/age/keys.txt ]; then
    export SOPS_AGE_KEY_FILE=/paperclip/.config/sops/age/keys.txt
  elif [ -f "$HOME/.config/sops/age/keys.txt" ]; then
    export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
  fi
fi

if [ ! -f "${SOPS_AGE_KEY_FILE:-/nonexistent}" ]; then
  echo "ERROR: age key not found. Set SOPS_AGE_KEY_FILE or place keys.txt." >&2
  exit 1
fi

sops -d "$ROOT/secrets/dev.env" > "$ROOT/.env"
echo "OK: .env generated from secrets/dev.env"
