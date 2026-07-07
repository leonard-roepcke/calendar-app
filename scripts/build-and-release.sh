#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="$ROOT_DIR/releases/build.log"
mkdir -p "$ROOT_DIR/releases"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  for JAVA_CANDIDATE in \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-17-openjdk \
    /usr/lib/jvm/java-21-openjdk-amd64; do
    if [ -x "$JAVA_CANDIDATE/bin/java" ]; then
      JAVA_HOME="$JAVA_CANDIDATE"
      break
    fi
  done
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  JAVA_BIN="$(command -v javac || command -v java || true)"
  if [ -n "$JAVA_BIN" ]; then
    JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$JAVA_BIN")")")"
  fi
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "JAVA_HOME is not set and no Java installation could be detected." >&2
  exit 1
fi

export JAVA_HOME
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin:$PATH"
export NODE_ENV=production

log "Starting build-and-release pipeline"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  log "Installing npm dependencies"
  npm ci
fi

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  log "Staging and committing changes"
  git add -A
  git commit -m "Auto-release: $(date -Iseconds)" || true
fi

VERSION="$(node -p "require('./package.json').version")"
VERSION_CODE="$(node -p "require('./app.json').expo.android.versionCode")"
BUILD_ID="$(date +%Y%m%d-%H%M%S)"
TAG="v${VERSION}-${BUILD_ID}"
APK_NAME="calendar-app-${TAG}.apk"
APK_PATH="$ROOT_DIR/releases/$APK_NAME"
APK_SHA256_PATH="$APK_PATH.sha256"

log "Preparing Android project (Expo prebuild)"
npx --no-install expo prebuild --platform android --no-install

log "Building APK"
cd "$ROOT_DIR/android"
chmod +x gradlew
./gradlew assembleRelease --no-daemon

BUILT_APK="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$BUILT_APK" ]; then
  log "Release APK not found, falling back to debug build"
  ./gradlew assembleDebug --no-daemon
  BUILT_APK="$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
fi

cp "$BUILT_APK" "$APK_PATH"
log "APK saved to $APK_PATH"

(cd "$ROOT_DIR" && sha256sum "releases/$APK_NAME" > "$APK_SHA256_PATH")
printf '%s\n' "$TAG" > "$ROOT_DIR/releases/latest-tag.txt"
log "APK checksum saved to $APK_SHA256_PATH"

cd "$ROOT_DIR"
git add -A
git commit -m "Release $TAG" || true

log "Pushing to GitHub"
git push -u origin HEAD

if command -v gh >/dev/null 2>&1; then
  log "Creating GitHub release $TAG"
  gh release create "$TAG" "$APK_PATH" "$APK_SHA256_PATH" \
    --target "$(git rev-parse HEAD)" \
    --title "Calendar App $TAG (Android versionCode $VERSION_CODE)" \
    --notes "Automatischer Release nach Cursor-Änderungen. Android versionCode: $VERSION_CODE." \
    || log "GitHub release creation failed (tag may already exist)"
else
  log "gh CLI not found, skipping GitHub release"
fi

log "Pipeline finished successfully"
