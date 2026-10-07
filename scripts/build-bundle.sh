#!/usr/bin/env bash

# ==============================================================================
# Production-Grade Student Telemetry Platform: Google Play Bundle Build Script
# Compiles React Native + Kotlin Native Module into Android App Bundle (.aab)
# Ready for Google Play Console (Internal Testing / Closed Track)
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
echo "    STUDENT TELEMETRY CLIENT: GOOGLE PLAY APP BUNDLE (.AAB) BUILD         "
echo "=========================================================================="
echo -e "${NC}"

cd "$MOBILE_DIR"

# 1. Check Dependencies
echo -e "${BLUE}[STEP 1/4] Checking Mobile Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi

# 2. Check Java / Toolchain
echo -e "${BLUE}[STEP 2/4] Validating Java Toolchain...${NC}"
if command -v javac &> /dev/null; then
    JAVA_VER=$(javac -version 2>&1)
    echo -e "${GREEN}[OK] Java Compiler:${NC} $JAVA_VER"
fi

# 3. Prebuild Native Project
echo -e "${BLUE}[STEP 3/4] Ensuring Android Native Project is Up-to-Date...${NC}"
CI=1 npx expo prebuild --platform android --no-install

# 4. Compile Release Android App Bundle (.aab)
echo -e "${BLUE}[STEP 4/4] Compiling Android App Bundle (./gradlew bundleRelease)...${NC}"
cd "$MOBILE_DIR/android"
chmod +x ./gradlew
./gradlew bundleRelease

AAB_OUTPUT="$MOBILE_DIR/android/app/build/outputs/bundle/release/app-release.aab"

if [ -f "$AAB_OUTPUT" ]; then
    mkdir -p "$RELEASE_DIR"
    RELEASE_AAB="$RELEASE_DIR/student-telemetry-client.aab"
    cp "$AAB_OUTPUT" "$RELEASE_AAB"

    echo ""
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo -e "${GREEN}${BOLD}   [GOOGLE PLAY READY] APP BUNDLE EXPORTED TO RELEASE FOLDER:             ${NC}"
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo -e "  📂 Release Directory: ${BOLD}$RELEASE_DIR${NC}"
    echo -e "  📦 Google Play AAB:   ${CYAN}${BOLD}$RELEASE_AAB${NC}"
    echo -e "  📏 Size:              $(du -h "$RELEASE_AAB" | cut -f1)"
    echo -e "${GREEN}${BOLD}==========================================================================${NC}"
    echo ""
    echo -e "${CYAN}Next Step: Upload this .aab file to Google Play Console (Internal Testing Track).${NC}"
else
    echo -e "${RED}[ERROR] AAB file not found at expected location.${NC}"
    exit 1
fi
