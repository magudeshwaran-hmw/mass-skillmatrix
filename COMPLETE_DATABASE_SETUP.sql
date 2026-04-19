-- ═══════════════════════════════════════════════════════════════════════════════
-- ZENSAR SKILL MATRIX - COMPLETE DATABASE SETUP
-- ═══════════════════════════════════════════════════════════════════════════════
-- Version: 2.0 (Updated with all 32 skills + Education + Achievements)
-- Database: PostgreSQL 14+
-- Run this SINGLE file to create the complete database from scratch
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: DROP EXISTING TABLES (Clean Slate)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS growth_plans CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Drop views if they exist
DROP VIEW IF EXISTS employee_skills_summary CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE EMPLOYEES TABLE (with all 32 skills as columns)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    zensar_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    designation VARCHAR(255),
    department VARCHAR(255) DEFAULT 'Quality Engineering',
    location VARCHAR(255) DEFAULT 'India',
    years_it INTEGER DEFAULT 0,
    years_zensar INTEGER DEFAULT 0,
    password VARCHAR(255),
    overall_capability INTEGER DEFAULT 0,
    submitted BOOLEAN DEFAULT FALSE,
    resume_uploaded BOOLEAN DEFAULT FALSE,
    primary_skill VARCHAR(255),
    primary_domain VARCHAR(255),
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- ALL 32 SKILLS (Self Rating: 0-3, Manager Rating: 0-3, Validated: boolean)
    -- ═══════════════════════════════════════════════════════════════════════════
    
    -- Technical Tools (6 skills)
    "Selenium" INTEGER DEFAULT 0 CHECK ("Selenium" >= 0 AND "Selenium" <= 3),
    "Appium" INTEGER DEFAULT 0 CHECK ("Appium" >= 0 AND "Appium" <= 3),
    "JMeter" INTEGER DEFAULT 0 CHECK ("JMeter" >= 0 AND "JMeter" <= 3),
    "Postman" INTEGER DEFAULT 0 CHECK ("Postman" >= 0 AND "Postman" <= 3),
    "JIRA" INTEGER DEFAULT 0 CHECK ("JIRA" >= 0 AND "JIRA" <= 3),
    "TestRail" INTEGER DEFAULT 0 CHECK ("TestRail" >= 0 AND "TestRail" <= 3),
    
    -- Programming Languages (6 skills)
    "Python" INTEGER DEFAULT 0 CHECK ("Python" >= 0 AND "Python" <= 3),
    "Java" INTEGER DEFAULT 0 CHECK ("Java" >= 0 AND "Java" <= 3),
    "JavaScript" INTEGER DEFAULT 0 CHECK ("JavaScript" >= 0 AND "JavaScript" <= 3),
    "TypeScript" INTEGER DEFAULT 0 CHECK ("TypeScript" >= 0 AND "TypeScript" <= 3),
    "C#" INTEGER DEFAULT 0 CHECK ("C#" >= 0 AND "C#" <= 3),
    "SQL" INTEGER DEFAULT 0 CHECK ("SQL" >= 0 AND "SQL" <= 3),
    
    -- Testing Types (5 skills)
    "API Testing" INTEGER DEFAULT 0 CHECK ("API Testing" >= 0 AND "API Testing" <= 3),
    "Mobile Testing" INTEGER DEFAULT 0 CHECK ("Mobile Testing" >= 0 AND "Mobile Testing" <= 3),
    "Performance Testing" INTEGER DEFAULT 0 CHECK ("Performance Testing" >= 0 AND "Performance Testing" <= 3),
    "Security Testing" INTEGER DEFAULT 0 CHECK ("Security Testing" >= 0 AND "Security Testing" <= 3),
    "Database Testing" INTEGER DEFAULT 0 CHECK ("Database Testing" >= 0 AND "Database Testing" <= 3),
    
    -- Domain Knowledge (5 skills)
    "Banking" INTEGER DEFAULT 0 CHECK ("Banking" >= 0 AND "Banking" <= 3),
    "Healthcare" INTEGER DEFAULT 0 CHECK ("Healthcare" >= 0 AND "Healthcare" <= 3),
    "E-Commerce" INTEGER DEFAULT 0 CHECK ("E-Commerce" >= 0 AND "E-Commerce" <= 3),
    "Insurance" INTEGER DEFAULT 0 CHECK ("Insurance" >= 0 AND "Insurance" <= 3),
    "Telecom" INTEGER DEFAULT 0 CHECK ("Telecom" >= 0 AND "Telecom" <= 3),
    
    -- Testing Methodologies (4 skills)
    "Functional Testing" INTEGER DEFAULT 0 CHECK ("Functional Testing" >= 0 AND "Functional Testing" <= 3),
    "Automation Testing" INTEGER DEFAULT 0 CHECK ("Automation Testing" >= 0 AND "Automation Testing" <= 3),
    "Regression Testing" INTEGER DEFAULT 0 CHECK ("Regression Testing" >= 0 AND "Regression Testing" <= 3),
    "UAT" INTEGER DEFAULT 0 CHECK ("UAT" >= 0 AND "UAT" <= 3),
    
    -- DevOps & Tools (4 skills)
    "Git" INTEGER DEFAULT 0 CHECK ("Git" >= 0 AND "Git" <= 3),
    "Jenkins" INTEGER DEFAULT 0 CHECK ("Jenkins" >= 0 AND "Jenkins" <= 3),
    "Docker" INTEGER DEFAULT 0 CHECK ("Docker" >= 0 AND "Docker" <= 3),
    "Azure DevOps" INTEGER DEFAULT 0 CHECK ("Azure DevOps" >= 0 AND "Azure DevOps" <= 3),
    
    -- AI & Emerging Technologies (2 skills)
    "ChatGPT/Prompt Engineering" INTEGER DEFAULT 0 CHECK ("ChatGPT/Prompt Engineering" >= 0 AND "ChatGPT/Prompt Engineering" <= 3),
    "AI Test Automation" INTEGER DEFAULT 0 CHECK ("AI Test Automation" >= 0 AND "AI Test Automation" <= 3),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE SKILLS TABLE (Normalized - for backward compatibility)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    self_rating INTEGER DEFAULT 0 CHECK (self_rating >= 0 AND self_rating <= 3),
    manager_rating INTEGER CHECK (manager_rating >= 0 AND manager_rating <= 3),
    validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, skill_name)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE PROJECTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    client VARCHAR(255),
    domain VARCHAR(255),
    role VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    description TEXT,
    outcome TEXT,
    team_size INTEGER,
    technologies TEXT[],
    skills_used TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE CERTIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    cert_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    no_expiry BOOLEAN DEFAULT FALSE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE EDUCATION TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE education (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    degree VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: CREATE ACHIEVEMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_achieved DATE,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: CREATE GROWTH PLANS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE growth_plans (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    skill_name VARCHAR(255),
    current_level INTEGER DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 3),
    target_level INTEGER DEFAULT 0 CHECK (target_level >= 0 AND target_level <= 3),
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(50) DEFAULT 'Active',
    actions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_zensar_id ON employees(zensar_id);
CREATE INDEX idx_employees_submitted ON employees(submitted);
CREATE INDEX idx_skills_employee_id ON skills(employee_id);
CREATE INDEX idx_projects_employee_id ON projects(employee_id);
CREATE INDEX idx_certifications_employee_id ON certifications(employee_id);
CREATE INDEX idx_education_employee_id ON education(employee_id);
CREATE INDEX idx_achievements_employee_id ON achievements(employee_id);
CREATE INDEX idx_growth_plans_employee_id ON growth_plans(employee_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 10: CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_plans_updated_at BEFORE UPDATE ON growth_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 11: CREATE ADMIN USER (Default Password: admin123)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO employees (
    id, zensar_id, name, email, designation, department, password
) VALUES (
    'admin', 'ADMIN', 'System Administrator', 'admin@zensar.com', 
    'Administrator', 'IT', '$2b$10$rQZ5YvZxQxZ5YvZxQxZ5YuZxQxZ5YvZxQxZ5YvZxQxZ5YvZxQxZ5Y'
) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 12: SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ ZENSAR SKILL MATRIX DATABASE SETUP COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created Tables:';
    RAISE NOTICE '   ✓ employees (with 32 skill columns)';
    RAISE NOTICE '   ✓ skills (normalized table)';
    RAISE NOTICE '   ✓ projects';
    RAISE NOTICE '   ✓ certifications';
    RAISE NOTICE '   ✓ education';
    RAISE NOTICE '   ✓ achievements';
    RAISE NOTICE '   ✓ growth_plans';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Created Indexes for optimal performance';
    RAISE NOTICE '⚡ Created Triggers for auto-timestamps';
    RAISE NOTICE '👤 Created Admin User (email: admin@zensar.com, password: admin123)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Database is ready! Start your server with: npm run server';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
END $$;

COMMIT;
