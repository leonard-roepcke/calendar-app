#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SCRIPT="$ROOT_DIR/scripts/build-and-release.sh"

if [ ! -x "$SCRIPT" ]; then
  exit 0
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin:$PATH"
export NODE_ENV=production

# Run asynchronously so Cursor is not blocked during APK build.
nohup "$SCRIPT" >> "$ROOT_DIR/releases/hook.log" 2>&1 &

exit 0
