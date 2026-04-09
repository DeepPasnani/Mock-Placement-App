require('dotenv').config();
const { query } = require('./index');

async function migrate() {
  console.log('Running database migrations...');

  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin', 'admin', 'student')),
      department VARCHAR(100),
      google_id VARCHAR(255) UNIQUE,
      avatar_url TEXT,
      branch VARCHAR(100),
      roll_number VARCHAR(50),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Tests table
    CREATE TABLE IF NOT EXISTS tests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      duration_minutes INTEGER NOT NULL DEFAULT 90,
      department VARCHAR(100) NOT NULL,
      settings JSONB DEFAULT '{}',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Sections table
    CREATE TABLE IF NOT EXISTS sections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('aptitude', 'coding')),
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Questions table (aptitude)
    CREATE TABLE IF NOT EXISTS questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL DEFAULT 'mcq',
      text TEXT NOT NULL,
      image_url TEXT,
      options JSONB,
      option_images JSONB,
      correct_answer JSONB,
      explanation TEXT,
      marks INTEGER DEFAULT 2,
      difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Coding problems table
    CREATE TABLE IF NOT EXISTS coding_problems (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      image_url TEXT,
      input_format TEXT,
      output_format TEXT,
      constraints TEXT,
      sample_input TEXT,
      sample_output TEXT,
      explanation TEXT,
      test_cases JSONB DEFAULT '[]',
      starter_code JSONB DEFAULT '{}',
      time_limit_seconds INTEGER DEFAULT 2,
      memory_limit_mb INTEGER DEFAULT 256,
      marks INTEGER DEFAULT 10,
      difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      tags TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Submissions table
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
      score NUMERIC(8,2) DEFAULT 0,
      max_score NUMERIC(8,2) DEFAULT 0,
      answers JSONB DEFAULT '{}',
      code_solutions JSONB DEFAULT '{}',
      code_results JSONB DEFAULT '{}',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      submitted_at TIMESTAMPTZ,
      time_taken_seconds INTEGER,
      ip_address INET,
      flagged_questions JSONB DEFAULT '[]',
      UNIQUE(test_id, user_id)
    );

    -- Test invitations / allowed users
    CREATE TABLE IF NOT EXISTS test_invitations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255),
      invited_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Audit log
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      metadata JSONB,
      ip_address INET,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes for performance with 1000 concurrent users
    CREATE INDEX IF NOT EXISTS idx_submissions_test_id ON submissions(test_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_questions_section_id ON questions(section_id);
    CREATE INDEX IF NOT EXISTS idx_coding_problems_section_id ON coding_problems(section_id);
    CREATE INDEX IF NOT EXISTS idx_sections_test_id ON sections(test_id);
    CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
  `);

  console.log('✅ Migrations complete.');
  process.exit(0);
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
