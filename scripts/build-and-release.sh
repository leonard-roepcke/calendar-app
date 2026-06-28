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
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin:$PATH"
export NODE_ENV=production

log "Starting build-and-release pipeline"

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  log "Staging and committing changes"
  git add -A
  git commit -m "Auto-release: $(date -Iseconds)" || true
fi

VERSION="$(node -p "require('./package.json').version")"
BUILD_ID="$(date +%Y%m%d-%H%M%S)"
TAG="v${VERSION}-${BUILD_ID}"
APK_NAME="calendar-app-${TAG}.apk"
APK_PATH="$ROOT_DIR/releases/$APK_NAME"

log "Preparing Android project (Expo prebuild)"
npx expo prebuild --platform android --no-install

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

cd "$ROOT_DIR"
git add -A
git commit -m "Release $TAG" || true

log "Pushing to GitHub"
git push -u origin HEAD

if command -v gh >/dev/null 2>&1; then
  log "Creating GitHub release $TAG"
  gh release create "$TAG" "$APK_PATH" \
    --title "Calendar App $TAG" \
    --notes "Automatischer Release nach Cursor-Änderungen." \
    || log "GitHub release creation failed (tag may already exist)"
else
  log "gh CLI not found, skipping GitHub release"
fi

log "Pipeline finished successfully"
