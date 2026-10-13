#!/usr/bin/env bash

# ==============================================================================
# Aegis Student Telemetry Platform: Production Android App Bundle (AAB) Builder
# Compiles optimized release bundle for Google Play Console & MDM Fleets
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
RELEASE_DIR="$ROOT_DIR/release"

# Load Centralized .env
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=========================================================================="
echo "    AEGIS TELEMETRY: PRODUCTION RELEASE AAB (APP BUNDLE) BUILDER         "
echo "=========================================================================="
echo -e "${NC}"

# Ensure react-native root symlink exists for Gradle monorepo resolution
if [ ! -d "$ROOT_DIR/node_modules/react-native" ] && [ -d "$MOBILE_DIR/node_modules/react-native" ]; then
    mkdir -p "$ROOT_DIR/node_modules"
    ln -sf "$MOBILE_DIR/node_modules/react-native" "$ROOT_DIR/node_modules/react-native"
fi

cd "$MOBILE_DIR"

# 1. Check Dependencies
echo -e "${BLUE}[STEP 1/5] Checking Mobile Client Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing mobile dependencies...${NC}"
    npm install
fi

# 2. Check Java & Android SDK
echo -e "${BLUE}[STEP 2/5] Validating Compilation Environment...${NC}"
if command -v javac &> /dev/null; then
    JAVA_VER=$(javac -version 2>&1)
    echo -e "${GREEN}[OK] Java Compiler:${NC} $JAVA_VER"
else
    echo -e "${YELLOW}[WARNING] javac not found in PATH.${NC}"
fi

if [ -n "$ANDROID_HOME" ]; then
    echo -e "${GREEN}[OK] ANDROID_HOME:${NC} $ANDROID_HOME"
fi

# 3. Export JS Bundle for Release
echo -e "${BLUE}[STEP 3/5] Compiling Production JavaScript Bundle...${NC}"
mkdir -p "$MOBILE_DIR/android/app/src/main/assets"
npx expo export:embed \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output "$MOBILE_DIR/android/app/src/main/assets/index.android.bundle" \
    --assets-dest "$MOBILE_DIR/android/app/src/main/res"

# 4. Compile Release Android App Bundle via Gradle
echo -e "${BLUE}[STEP 4/5] Running Gradle bundleRelease (R8/ProGuard Active)...${NC}"
cd "$MOBILE_DIR/android"
chmod +x ./gradlew

# Execute Gradle bundleRelease
./gradlew bundleRelease -Pandroid.enableProguardInReleaseBuilds=true || {
    echo -e "${RED}[ERROR] Gradle bundleRelease failed. Check Gradle build output above.${NC}"
    exit 1
}

# 5. Export and Verify Release Bundle
echo -e "${BLUE}[STEP 5/5] Packaging & Exporting AAB Artifact...${NC}"
AAB_PATH="$MOBILE_DIR/android/app/build/outputs/bundle/release/app-release.aab"

if [ -f "$AAB_PATH" ]; then
    mkdir -p "$RELEASE_DIR"
    TARGET_AAB="$RELEASE_DIR/aegis-student-telemetry.aab"
    cp "$AAB_PATH" "$TARGET_AAB"
    cp "$AAB_PATH" "$RELEASE_DIR/app-release.aab"

    FILE_SIZE=$(du -h "$TARGET_AAB" | cut -f1)
    SHA256=$(sha256sum "$TARGET_AAB" | awk '{print $1}')

    echo ""
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo -e "${GREEN}${BOLD}     [SUCCESS] PRODUCTION RELEASE AAB BUNDLE GENERATED                    ${NC}"
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo -e "  📂 Output Path:     ${BOLD}$TARGET_AAB${NC}"
    echo -e "  📦 Bundle Size:     ${CYAN}$FILE_SIZE${NC}"
    echo -e "  🔒 SHA-256 Digest:  ${YELLOW}$SHA256${NC}"
    echo -e "  🚀 Target:          Google Play Console / Private Enterprise MDM"
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo ""
else
    echo -e "${RED}[ERROR] Expected bundle artifact not found at $AAB_PATH${NC}"
    exit 1
fi
