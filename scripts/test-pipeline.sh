#!/usr/bin/env bash

# ==============================================================================
# Production-Grade Student Telemetry Platform: Integration Test Runner
# Sources centralized root .env before launching tests.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load centralized .env
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

echo "Running complete end-to-end telemetry verification test suite..."
cd "$ROOT_DIR/services/backend"
npx tsx src/test_integration.ts
