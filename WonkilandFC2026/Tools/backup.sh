#!/usr/bin/env bash
# 단계별 백업 (Linux/macOS/Git Bash): Backups/WonkilandFC2026_<날짜시간>_<라벨>.tar.gz
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="${1:-manual}"
DEST="$ROOT/Backups/WonkilandFC2026_$(date +%Y%m%d_%H%M%S)_${LABEL}.tar.gz"
tar --exclude=./Backups --exclude=./node_modules --exclude=./Tests/screenshots -czf "$DEST" -C "$ROOT" .
echo "Backup created: $DEST"
