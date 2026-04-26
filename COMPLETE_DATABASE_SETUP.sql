-- ============================================================
-- ZENSAR SKILL NAVIGATOR — COMPLETE DATABASE SETUP
-- Run this on a fresh PostgreSQL database: skillmatrix
-- Version: April 2026
-- ============================================================

-- Create database (run as superuser if needed)
-- CREATE DATABASE skillmatrix;
-- \c skillmatrix

-- ============================================================
-- 1. EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id                VARCHAR(50)  PRIMARY KEY,
  zensar_id         VARCHAR(50)  UNIQUE,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) UNIQUE,
  phone             VARCHAR(50),
  designation       VARCHAR(255),
  department        VARCHAR(255),
  location          VARCHAR(255),
  years_it          INTEGER      DEFAULT 0,
  years_zensar      INTEGER      DEFAULT 0,
  password          VARCHAR(255),
  overall_capability INTEGER     DEFAULT 0,
  submitted         BOOLEAN      DEFAULT FALSE,
  resume_uploaded   BOOLEAN      DEFAULT FALSE,
  primary_skill     VARCHAR(255),
  primary_domain    VARCHAR(255),
  secondary_skill   VARCHAR(255),
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_email      ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_zensar_id  ON employees(zensar_id);

-- ============================================================
-- 2. SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id           SERIAL       PRIMARY KEY,
  employee_id  VARCHAR(50)  REFERENCES employees(id) ON DELETE CASCADE,
  skill_name   VARCHAR(255) NOT NULL,
  self_rating  INTEGER      DEFAULT 0,
  manager_rating INTEGER,
  validated    BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skills_employee_id ON skills(employee_id);

-- ============================================================
-- 3. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL       PRIMARY KEY,
  employee_id  VARCHAR(50)  REFERENCES employees(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  role         VARCHAR(255),
  client       VARCHAR(255),
  domain       VARCHAR(255),
  start_date   DATE,
  end_date     DATE,
  description  TEXT,
  technologies TEXT[],
  skills_used  TEXT[],
  team_size    INTEGER      DEFAULT 0,
  outcome      TEXT,
  is_ongoing   BOOLEAN      DEFAULT FALSE,
  is_ai_extracted BOOLEAN  DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_employee_id ON projects(employee_id);

-- ============================================================
-- 4. CERTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certifications (
  id                   SERIAL       PRIMARY KEY,
  employee_id          VARCHAR(50)  REFERENCES employees(id) ON DELETE CASCADE,
  cert_name            VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date           DATE,
  expiry_date          DATE,
  no_expiry            BOOLEAN      DEFAULT FALSE,
  credential_id        VARCHAR(255),
  credential_url       TEXT,
  is_ai_extracted      BOOLEAN      DEFAULT FALSE,
  created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id);

-- ============================================================
-- 5. EDUCATION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS education (
  id             SERIAL       PRIMARY KEY,
  employee_id    VARCHAR(50)  REFERENCES employees(id) ON DELETE CASCADE,
  degree         VARCHAR(255),
  institution    VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date     VARCHAR(50),
  end_date       VARCHAR(50),
  grade          VARCHAR(50),
  description    TEXT,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_employee_id ON education(employee_id);

-- ============================================================
-- 6. ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id              VARCHAR(50)  PRIMARY KEY,
  employee_id     VARCHAR(50)  REFERENCES employees(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  award_type      VARCHAR(50)  DEFAULT 'Other',
  category        VARCHAR(50)  DEFAULT 'Other',
  date_received   VARCHAR(50),
  description     TEXT,
  issuer          VARCHAR(255),
  project_context VARCHAR(255),
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_employee_id ON achievements(employee_id);

-- ============================================================
-- 7. APP SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT
);

-- Default admin credentials
INSERT INTO app_settings (key, value) VALUES ('admin_id', 'admin')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('admin_password', 'admin123')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 8. BFSI ROLES TABLE (Reactive + Proactive SRFs)
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_roles (
  id              SERIAL       PRIMARY KEY,
  role_id         VARCHAR(50)  UNIQUE NOT NULL,
  role_title      VARCHAR(255) NOT NULL,
  client_name     VARCHAR(255),
  required_skills TEXT[],
  days_open       INTEGER      DEFAULT 0,
  status          VARCHAR(50)  DEFAULT 'Open',
  fill_priority   VARCHAR(50)  DEFAULT 'Medium',
  assigned_spoc   VARCHAR(255),
  created_date    DATE         DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  hire_type       VARCHAR(50),
  job_description TEXT,
  srf_no          VARCHAR(50),
  aging_bucket    VARCHAR(50),
  type            VARCHAR(50),
  location        VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_bfsi_roles_status ON bfsi_roles(status);
CREATE INDEX IF NOT EXISTS idx_bfsi_roles_type   ON bfsi_roles(type);

-- ============================================================
-- 9. BFSI WORKFORCE TABLE (Pool + Deallocation employees)
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_workforce (
  id                   SERIAL       PRIMARY KEY,
  employee_id          VARCHAR(50)  NOT NULL UNIQUE,
  employee_name        VARCHAR(255) NOT NULL,
  email                VARCHAR(255),
  current_skills       TEXT[],
  certifications       TEXT[],
  experience_years     INTEGER      DEFAULT 0,
  status               VARCHAR(50)  DEFAULT 'Available',
  doj                  DATE,
  primary_skill        VARCHAR(255),
  domain_expertise     TEXT[],
  reskilling_program   VARCHAR(255),
  graduation_date      DATE,
  bench_days           INTEGER      DEFAULT 0,
  reject_count         INTEGER      DEFAULT 0,
  band                 VARCHAR(50),
  billing_status       VARCHAR(50),
  project_name         VARCHAR(255),
  customer             VARCHAR(255),
  pm_name              VARCHAR(255),
  location             VARCHAR(255),
  aging_days           INTEGER      DEFAULT 0,
  practice_name        VARCHAR(255),
  service_line         VARCHAR(255),
  deployable_flag      BOOLEAN      DEFAULT FALSE,
  rmg_status           VARCHAR(100),
  pool_status          VARCHAR(100),
  deallocation_date    DATE,
  return_to_pool_date  DATE,
  release_reason       VARCHAR(255),
  grade                VARCHAR(50),
  comments             TEXT,
  srf_no               VARCHAR(50),
  created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bfsi_workforce_status  ON bfsi_workforce(status);
CREATE INDEX IF NOT EXISTS idx_bfsi_workforce_billing ON bfsi_workforce(billing_status);

-- ============================================================
-- 10. BFSI CERTIFICATIONS PIPELINE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_certifications (
  id                  SERIAL       PRIMARY KEY,
  employee_id         VARCHAR(50)  REFERENCES bfsi_workforce(employee_id) ON DELETE CASCADE,
  cert_name           VARCHAR(255) NOT NULL,
  provider            VARCHAR(255),
  start_date          DATE,
  expected_completion DATE,
  status              VARCHAR(50)  DEFAULT 'In Progress',
  duration_weeks      INTEGER      DEFAULT 4,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bfsi_certifications_emp ON bfsi_certifications(employee_id);

-- ============================================================
-- 11. BFSI ROLE ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_assignments (
  id                SERIAL       PRIMARY KEY,
  role_id           VARCHAR(50)  REFERENCES bfsi_roles(role_id) ON DELETE CASCADE,
  employee_id       VARCHAR(50)  REFERENCES bfsi_workforce(employee_id) ON DELETE CASCADE,
  match_score       INTEGER      DEFAULT 0,
  assignment_status VARCHAR(50)  DEFAULT 'Shortlisted',
  assigned_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_bfsi_assignments_role ON bfsi_assignments(role_id);

-- ============================================================
-- 12. BFSI UPLOAD HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_uploads (
  id                 SERIAL       PRIMARY KEY,
  filename           VARCHAR(255),
  uploaded_by        VARCHAR(255),
  upload_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  records_processed  INTEGER      DEFAULT 0,
  status             VARCHAR(50)  DEFAULT 'Success'
);

-- ============================================================
-- 13. BFSI SUMMARY DATA TABLE (from Excel Summary sheet)
-- ============================================================
CREATE TABLE IF NOT EXISTS bfsi_summary_data (
  id                  SERIAL       PRIMARY KEY,
  primary_skill       VARCHAR(255) UNIQUE NOT NULL,
  reactive_srf        INTEGER      DEFAULT 0,
  reactive_backup     INTEGER      DEFAULT 0,
  demand_forecast     INTEGER      DEFAULT 0,
  proactive           INTEGER      DEFAULT 0,
  demand_total        INTEGER      DEFAULT 0,
  pool_supply         INTEGER      DEFAULT 0,
  deallocation_supply INTEGER      DEFAULT 0,
  supply_total        INTEGER      DEFAULT 0,
  gap                 INTEGER      DEFAULT 0,
  offers_reactive     INTEGER      DEFAULT 0,
  offers_proactive    INTEGER      DEFAULT 0,
  offers_total        INTEGER      DEFAULT 0,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bfsi_summary_skill ON bfsi_summary_data(primary_skill);

-- ============================================================
-- DONE — All tables created successfully
-- ============================================================
-- To verify: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
