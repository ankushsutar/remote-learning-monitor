#!/usr/bin/env bash

# ==============================================================================
# Production-Grade Student Telemetry Platform: Mobile Build & Deployment Script
# Compiles React Native + Kotlin Native Module (API 34) into Debug APK
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
echo "    STUDENT TELEMETRY CLIENT: ANDROID NATIVE MODULE BUILD SCRIPT         "
echo "=========================================================================="
echo -e "${NC}"

cd "$MOBILE_DIR"

# 1. Check Node & NPM dependencies
echo -e "${BLUE}[STEP 1/5] Checking Mobile Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing mobile dependencies...${NC}"
    npm install
fi

# 2. Check Java & Android Environment
echo -e "${BLUE}[STEP 2/5] Validating Java & Android SDK Toolchain...${NC}"
if command -v javac &> /dev/null; then
    JAVA_VER=$(javac -version 2>&1)
    echo -e "${GREEN}[OK] Java Compiler:${NC} $JAVA_VER"
else
    echo -e "${YELLOW}[WARNING] javac not found in PATH. Ensure JDK 17+ is installed if compiling locally.${NC}"
fi

if [ -n "$ANDROID_HOME" ]; then
    echo -e "${GREEN}[OK] ANDROID_HOME:${NC} $ANDROID_HOME"
else
    echo -e "${YELLOW}[INFO] ANDROID_HOME is not set in environment.${NC}"
    echo -e "${YELLOW}       Standard default locations: $HOME/Android/Sdk or /usr/lib/android-sdk${NC}"
fi

# 3. Generate Android Native Project via Expo Prebuild
echo -e "${BLUE}[STEP 3/5] Generating Native Android Project with Config Plugin...${NC}"
echo -e "${CYAN}Running 'npx expo prebuild --platform android --no-install' to apply withUsagePermissions plugin...${NC}"

CI=1 npx expo prebuild --platform android --no-install

# 4. Compile Android APK via Gradle
echo -e "${BLUE}[STEP 4/5] Compiling Android Gradle Build (API 34 target)...${NC}"
if [ -d "$MOBILE_DIR/android" ]; then
    echo -e "${CYAN}Packaging JavaScript bundle into native assets...${NC}"
    mkdir -p "$MOBILE_DIR/android/app/src/main/assets"
    npx expo export:embed --platform android --dev false --entry-file index.js --bundle-output "$MOBILE_DIR/android/app/src/main/assets/index.android.bundle" --assets-dest "$MOBILE_DIR/android/app/src/main/res"

    cd "$MOBILE_DIR/android"
    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        echo -e "${CYAN}Executing: ./gradlew assembleDebug${NC}"
        ./gradlew assembleDebug || {
            echo -e "${RED}[ERROR] Gradle build encountered an error. Check Gradle daemon logs.${NC}"
            exit 1
        }
        APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            echo -e "${GREEN}${BOLD}[SUCCESS] Gradle APK compiled successfully!${NC}"
            
            # Copy to dedicated release directory
            mkdir -p "$RELEASE_DIR"
            RELEASE_APK="$RELEASE_DIR/student-telemetry-client.apk"
            cp "$APK_PATH" "$RELEASE_APK"
            cp "$APK_PATH" "$RELEASE_DIR/app-debug.apk"
            
            echo ""
            echo -e "${GREEN}${BOLD}==========================================================================${NC}"
            echo -e "${GREEN}${BOLD}     [RELEASE READY] APK EXPORTED TO SEPARATE RELEASE FOLDER:             ${NC}"
            echo -e "${GREEN}${BOLD}==========================================================================${NC}"
            echo -e "  📂 Release Directory: ${BOLD}$RELEASE_DIR${NC}"
            echo -e "  📦 Primary APK:       ${CYAN}${BOLD}$RELEASE_APK${NC}"
            echo -e "  📦 Standard APK:      ${CYAN}${BOLD}$RELEASE_DIR/app-debug.apk${NC}"
            echo -e "${GREEN}${BOLD}==========================================================================${NC}"
            echo ""
        fi
    fi
else
    echo -e "${YELLOW}[INFO] Android native folder generated. Open in Android Studio to build:${NC}"
    echo -e "       ${BOLD}$MOBILE_DIR/android${NC}"
fi

# 5. Check ADB & Connected Devices
echo -e "${BLUE}[STEP 5/5] Checking Connected Android Devices / Emulators...${NC}"
TARGET_INSTALL_APK="${RELEASE_APK:-$APK_PATH}"
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" || true)
    if [ -n "$DEVICES" ]; then
        echo -e "${GREEN}[OK] Detected active Android device(s):${NC}"
        echo "$DEVICES"
        if [ -n "$TARGET_INSTALL_APK" ] && [ -f "$TARGET_INSTALL_APK" ]; then
            echo -e "${CYAN}Installing APK onto device from release folder...${NC}"
            adb install -r "$TARGET_INSTALL_APK"
            echo -e "${GREEN}[SUCCESS] Installed Student Telemetry Client on connected device!${NC}"
            echo -e "${CYAN}Launching application...${NC}"
            adb shell am start -n com.telemetry.studentmonitor/com.telemetry.studentmonitor.MainActivity || true
        fi
    else
        echo -e "${YELLOW}[INFO] No connected physical device or emulator found via adb.${NC}"
        echo -e "       Launch an emulator with: ${BOLD}emulator -avd <emulator_name>${NC}"
        echo -e "       Then install with: ${BOLD}adb install -r $TARGET_INSTALL_APK${NC}"
    fi
else
    echo -e "${YELLOW}[INFO] adb command not found. To deploy to device, install Android platform-tools.${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}==========================================================================${NC}"
echo -e "${GREEN}${BOLD}                     MOBILE BUILD WORKFLOW COMPLETED                      ${NC}"
echo -e "${GREEN}${BOLD}==========================================================================${NC}"
