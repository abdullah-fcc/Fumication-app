-- FumiGuard Pro — PostgreSQL Schema
-- Run this once in Neon SQL Editor to create all tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS (admins, managers, workers, clients)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid    VARCHAR(128) UNIQUE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  role            VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'worker', 'client')),
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- WAREHOUSES (multi-location stock storage)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  address     TEXT NOT NULL,
  manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LOCATIONS (client premises: restaurants, hotels)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(255) NOT NULL,
  address            TEXT NOT NULL,
  lat                DECIMAL(10, 8),
  lng                DECIMAL(11, 8),
  geo_fence_radius   INTEGER DEFAULT 100,
  client_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_person     VARCHAR(255),
  contact_phone      VARCHAR(20),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- JOBS (fumigation tasks)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  status        VARCHAR(50) NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  location_id   UUID REFERENCES locations(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- JOB ASSIGNMENTS (many workers per job)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

-- ─────────────────────────────────────────
-- CHECK-INS (GPS-verified worker presence)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS check_ins (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id               UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at        TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at       TIMESTAMPTZ,
  lat                  DECIMAL(10, 8),
  lng                  DECIMAL(11, 8),
  is_within_geofence   BOOLEAN DEFAULT false
);

-- ─────────────────────────────────────────
-- INVENTORY (chemicals, equipment per warehouse)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 VARCHAR(255) NOT NULL,
  description          TEXT,
  unit                 VARCHAR(50) NOT NULL,
  quantity             DECIMAL(10, 2) NOT NULL DEFAULT 0,
  low_stock_threshold  DECIMAL(10, 2) DEFAULT 10,
  warehouse_id         UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  supplier             VARCHAR(255),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REPORTS (fumigation job reports + signatures)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id            UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  pests_found       TEXT[],
  areas_treated     TEXT[],
  before_photos     TEXT[],
  after_photos      TEXT[],
  worker_signature  TEXT,
  client_signature  TEXT,
  client_name       VARCHAR(255),
  notes             TEXT,
  pdf_url           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REPORT CHEMICALS (chemicals used per report)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_chemicals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id      UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  inventory_id   UUID REFERENCES inventory(id) ON DELETE SET NULL,
  quantity_used  DECIMAL(10, 2) NOT NULL,
  unit           VARCHAR(50)
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS (push alert logs)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  type        VARCHAR(50),
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INVOICES (billing per job)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID REFERENCES jobs(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  status      VARCHAR(50) DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issued_at   TIMESTAMPTZ DEFAULT NOW(),
  due_at      TIMESTAMPTZ,
  paid_at     TIMESTAMPTZ,
  notes       TEXT
);
