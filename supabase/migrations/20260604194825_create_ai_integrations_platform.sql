/*
  # AI Integrations Platform Schema

  1. New Tables
    - `ai_providers`
      - `id` (uuid, primary key)
      - `name` (text, provider name e.g. "OpenAI", "Anthropic", "Google")
      - `slug` (text, unique slug identifier)
      - `description` (text, provider description)
      - `logo_url` (text, URL to provider logo)
      - `api_base_url` (text, base URL for API calls)
      - `status` (text, active/inactive/beta)
      - `created_at` (timestamptz)
    
    - `integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `provider_id` (uuid, foreign key to ai_providers)
      - `name` (text, integration name)
      - `api_key_encrypted` (text, encrypted API key)
      - `config` (jsonb, provider-specific configuration)
      - `is_active` (boolean, whether integration is enabled)
      - `last_tested_at` (timestamptz)
      - `last_status` (text, success/error from last test)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, project name)
      - `description` (text)
      - `template` (text, project template type)
      - `files` (jsonb, project file structure)
      - `integration_id` (uuid, foreign key to integrations)
      - `prompt_template` (text, AI prompt template)
      - `status` (text, draft/running/stopped/error)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `execution_logs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text, what was executed)
      - `input` (text, input data)
      - `output` (text, output/response)
      - `status` (text, success/error/timeout)
      - `duration_ms` (integer, execution time)
      - `tokens_used` (integer, token count)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own integrations, projects, and logs
    - AI providers are publicly readable
    - All write operations require authentication and ownership
*/

-- AI Providers table (public reference data)
CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  logo_url text DEFAULT '',
  api_base_url text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read AI providers"
  ON ai_providers FOR SELECT
  TO authenticated
  USING (true);

-- Integrations table (user-specific)
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  api_key_encrypted text DEFAULT '',
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_tested_at timestamptz,
  last_status text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  template text DEFAULT 'blank',
  files jsonb DEFAULT '{}',
  integration_id uuid REFERENCES integrations(id) ON DELETE SET NULL,
  prompt_template text DEFAULT '',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Execution Logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  input text DEFAULT '',
  output text DEFAULT '',
  status text DEFAULT 'success',
  duration_ms integer DEFAULT 0,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own execution logs"
  ON execution_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own execution logs"
  ON execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own execution logs"
  ON execution_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed AI providers
INSERT INTO ai_providers (name, slug, description, logo_url, api_base_url, status) VALUES
  ('OpenAI', 'openai', 'GPT-4, GPT-3.5, DALL-E, Whisper - Leading AI models for text, image, and audio generation', '', 'https://api.openai.com/v1', 'active'),
  ('Anthropic', 'anthropic', 'Claude - Advanced AI assistant with long context windows and nuanced reasoning', '', 'https://api.anthropic.com/v1', 'active'),
  ('Google AI', 'google', 'Gemini, PaLM - Google''s multimodal AI models for text, code, and image understanding', '', 'https://generativelanguage.googleapis.com/v1', 'active'),
  ('Meta AI', 'meta', 'LLaMA, Code Llama - Open-source large language models for research and development', '', 'https://api.meta.ai/v1', 'beta'),
  ('Mistral', 'mistral', 'Mistral, Mixtral - Efficient European AI models with strong multilingual capabilities', '', 'https://api.mistral.ai/v1', 'active'),
  ('Cohere', 'cohere', 'Command, Embed - Enterprise AI for text generation, embeddings, and classification', '', 'https://api.cohere.ai/v1', 'active'),
  ('Stability AI', 'stability', 'Stable Diffusion, StableLM - Open-source image and text generation models', '', 'https://api.stability.ai/v1', 'active'),
  ('Hugging Face', 'huggingface', 'Inference API - Access thousands of open-source ML models', '', 'https://api-inference.huggingface.co', 'active');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider_id ON integrations(provider_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_integration_id ON projects(integration_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_project_id ON execution_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at DESC);
