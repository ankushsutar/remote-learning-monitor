#!/usr/bin/env bash

# ==============================================================================
# Production-Grade Student Telemetry Platform: Local Host Script
# Launches Ingestion Backend (Fastify) and Web Dashboard (Next.js) concurrently.
# Reads all environment configuration from the centralized root .env file.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_DIR="$ROOT_DIR/services/backend"
DASHBOARD_DIR="$ROOT_DIR/apps/dashboard"

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "=========================================================================="
echo "    AEGIS TELEMETRY: LOCAL PLATFORM RUNNER & SERVICE ORCHESTRATOR         "
echo "=========================================================================="
echo -e "${NC}"

# 1. Load Centralized .env from Root
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}[ENV] Loading centralized configuration from:${NC} $ENV_FILE"
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}[OK] Environment variables exported successfully.${NC}"
else
    echo -e "${YELLOW}[WARNING] No .env found at $ENV_FILE. Generating from .env.example...${NC}"
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    fi
fi

# Fallback default ports if not specified in .env
BACKEND_PORT="${PORT:-4000}"
DASHBOARD_PORT="${DASHBOARD_PORT:-3000}"

# Check Node environment
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is required but not installed.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${BLUE}[INFO] Node.js Environment:${NC} $NODE_VERSION"
echo -e "${BLUE}[CONFIG] Backend Port:${NC} $BACKEND_PORT | ${BLUE}Dashboard Port:${NC} $DASHBOARD_PORT"
echo -e "${BLUE}[CONFIG] Database Target:${NC} $DATABASE_URL"
echo -e "${BLUE}[CONFIG] Redis Target:${NC} $REDIS_URL"
echo ""

# 2. Verify Backend Dependencies
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installing backend dependencies...${NC}"
    (cd "$BACKEND_DIR" && npm install)
fi

# 3. Verify Dashboard Dependencies
if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installing dashboard dependencies...${NC}"
    (cd "$DASHBOARD_DIR" && npm install)
fi

# 4. Seed Database
echo -e "${BLUE}[DATABASE] Seeding application catalog & test fleet...${NC}"
(cd "$BACKEND_DIR" && npx tsx src/db/seeds/seed_categories.ts)

echo -e "${GREEN}[OK] Database initialized with 80+ categorized packages & student fleet.${NC}"
echo ""

# Trap handler for graceful shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}[SHUTDOWN] Terminating backend and dashboard servers...${NC}"
    kill 0 2>/dev/null || true
    wait 2>/dev/null || true
    echo -e "${GREEN}[SHUTDOWN] All services stopped cleanly.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 5. Start Ingestion Backend
echo -e "${CYAN}[BACKEND] Starting Fastify Ingestion & Analytics API on http://localhost:${BACKEND_PORT}...${NC}"
(cd "$BACKEND_DIR" && PORT=$BACKEND_PORT npx tsx watch src/server.ts) &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 6. Start Next.js Management Dashboard
echo -e "${CYAN}[DASHBOARD] Starting Next.js Web Management Dashboard on http://localhost:${DASHBOARD_PORT}...${NC}"
(cd "$DASHBOARD_DIR" && PORT=$DASHBOARD_PORT npm run dev) &
DASHBOARD_PID=$!

echo ""
echo -e "${GREEN}${BOLD}==========================================================================${NC}"
echo -e "${GREEN}${BOLD}           SERVICES OPERATIONAL & READY FOR TELEMETRY INGESTION           ${NC}"
echo -e "${GREEN}${BOLD}==========================================================================${NC}"
echo -e "${BOLD}1. Web Management Dashboard:${NC}  ${BLUE}http://localhost:${DASHBOARD_PORT}${NC}"
echo -e "${BOLD}2. Fastify Ingestion API:${NC}     ${BLUE}http://localhost:${BACKEND_PORT}${NC}"
echo -e "${BOLD}3. API Health Endpoint:${NC}       ${BLUE}http://localhost:${BACKEND_PORT}/health${NC}"
echo -e "${BOLD}4. Telemetry Batch Route:${NC}     ${BLUE}POST http://localhost:${BACKEND_PORT}/api/v1/telemetry/batch${NC}"
echo -e "${YELLOW}[TIP] For Android Emulator testing, point Mobile App to http://10.0.2.2:${BACKEND_PORT}${NC}"
echo -e "${CYAN}Press Ctrl+C to stop all local services.${NC}"
echo ""

# Wait for background processes
wait
