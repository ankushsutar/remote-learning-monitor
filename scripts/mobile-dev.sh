#!/usr/bin/env bash

# ==============================================================================
# Production-Grade Student Telemetry Platform: Mobile Dev Mode Script
# Launches Expo Dev Client (Metro Bundler) with Hot Reloading & Port Forwarding
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=========================================================================="
echo "    STUDENT TELEMETRY CLIENT: MOBILE DEV MODE (EXPO / METRO)             "
echo "=========================================================================="
echo -e "${NC}"

# 1. Load Centralized .env
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}[OK] Loaded environment from .env${NC}"
fi

BACKEND_PORT="${PORT:-4000}"

# 2. Check ADB & Connected Devices for Port Forwarding
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" || true)
    if [ -n "$DEVICES" ]; then
        echo -e "${BLUE}[ADB] Detected connected device/emulator. Setting up reverse proxy...${NC}"
        adb reverse tcp:8081 tcp:8081 || true
        adb reverse tcp:$BACKEND_PORT tcp:$BACKEND_PORT || true
        echo -e "${GREEN}[OK] Reverse port forwarding active:${NC}"
        echo -e "     - tcp:8081 (Metro Dev Server)"
        echo -e "     - tcp:$BACKEND_PORT (Fastify Backend API)"
    else
        echo -e "${YELLOW}[INFO] No USB-connected device or emulator detected via adb.${NC}"
        echo -e "       If running over Wi-Fi, ensure your phone and PC are on the same network."
        echo -e "       Backend URL in .env: ${BOLD}$EXPO_PUBLIC_BACKEND_URL${NC}"
    fi
fi

# 3. Start Expo Metro Bundler in Dev-Client Mode
echo ""
echo -e "${BLUE}[METRO] Starting Expo Dev Client on port 8081...${NC}"
echo -e "${GREEN}Controls:${NC}"
echo -e "  - Press ${BOLD}a${NC} to open/reload on Android device"
echo -e "  - Press ${BOLD}r${NC} to reload app bundle"
echo -e "  - Press ${BOLD}m${NC} to toggle dev menu"
echo -e "  - Press ${BOLD}j${NC} to open debugger"
echo ""

cd "$MOBILE_DIR"
npx expo start --dev-client
