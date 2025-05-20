-- Create initial database schema for InsureAI Fact Find application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  clerk_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  order INTEGER NOT NULL,
  options JSONB,
  conditional_logic JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  pdf_url TEXT,
  signature_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create configs table
CREATE TABLE IF NOT EXISTS configs (
  id SERIAL PRIMARY KEY,
  ai_prompt TEXT,
  ai_model TEXT DEFAULT 'gpt-4o',
  ai_temperature TEXT DEFAULT '0.7',
  email_template TEXT,
  email_recipients TEXT,
  excel_template TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE answers ADD CONSTRAINT fk_answers_session FOREIGN KEY (session_id) REFERENCES sessions(id);
ALTER TABLE answers ADD CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id);

-- Insert default AI prompt config
INSERT INTO configs (id, ai_prompt, ai_model, ai_temperature, created_at, updated_at)
VALUES (
  1,
  'You are an insurance assistant helping collect fact-find information. Be polite, clear, and concise. Ask one question at a time and wait for the user''s response before continuing. Use the user''s name when appropriate. If the user seems confused, offer clarification. For yes/no questions, present them as clear choices.',
  'gpt-4o',
  '0.7',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;