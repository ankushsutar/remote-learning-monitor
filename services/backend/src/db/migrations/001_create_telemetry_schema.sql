-- ============================================================================
-- PRODUCTION-GRADE TELEMETRY SCHEMA (PostgreSQL / TimescaleDB)
-- ============================================================================

-- 1. Enable UUID Extension & TimescaleDB Extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerated App Categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_category_enum') THEN
        CREATE TYPE app_category_enum AS ENUM (
            'PRODUCTIVE',
            'EDUCATIONAL',
            'SOCIAL_MEDIA',
            'GAMING',
            'ENTERTAINMENT',
            'UNCLASSIFIED'
        );
    END IF;
END$$;

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_code VARCHAR(64) UNIQUE NOT NULL,
    school_id UUID NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- 4. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) UNIQUE NOT NULL,
    os_version VARCHAR(64) NOT NULL,
    battery_optimization_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_student ON devices(student_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_last_sync ON devices(last_sync_at);

-- 5. Application Categories Catalog Table
CREATE TABLE IF NOT EXISTS app_categories (
    package_name VARCHAR(255) PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL,
    category app_category_enum NOT NULL DEFAULT 'UNCLASSIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_categories_cat ON app_categories(category);

-- 6. Telemetry Intervals Table
CREATE TABLE IF NOT EXISTS telemetry_intervals (
    id BIGSERIAL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    foreground_duration_sec INTEGER NOT NULL DEFAULT 0,
    bytes_rx BIGINT NOT NULL DEFAULT 0,
    bytes_tx BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, start_time)
);

-- Strict composite unique index to enforce idempotency on repeated sync attempts
CREATE UNIQUE INDEX IF NOT EXISTS uq_telemetry_device_pkg_start 
ON telemetry_intervals (device_id, package_name, start_time);

CREATE INDEX IF NOT EXISTS idx_telemetry_package_time 
ON telemetry_intervals (package_name, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_time 
ON telemetry_intervals (device_id, start_time DESC);

-- 7. Initialize TimescaleDB Hypertable if TimescaleDB extension is active
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('telemetry_intervals', 'start_time', if_not_exists => TRUE);
        RAISE NOTICE 'TimescaleDB hypertable created for telemetry_intervals.';
    ELSE
        RAISE NOTICE 'TimescaleDB extension not loaded; using standard PostgreSQL partitioned/indexed table.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB hypertable setup skipped or already active: %', SQLERRM;
END$$;
