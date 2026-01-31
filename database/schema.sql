-- Core identities and access control
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  scope_department_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  title VARCHAR(120) NOT NULL,
  hire_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id UUID PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES departments(id),
  code VARCHAR(30) NOT NULL,
  name VARCHAR(255) NOT NULL,
  semester VARCHAR(40) NOT NULL,
  academic_year VARCHAR(12) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_enrollments (
  course_id UUID NOT NULL REFERENCES courses(id),
  student_id UUID NOT NULL REFERENCES users(id),
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, student_id)
);

-- Evaluation configuration
CREATE TABLE evaluation_periods (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  semester VARCHAR(40) NOT NULL,
  academic_year VARCHAR(12) NOT NULL,
  opens_at TIMESTAMP NOT NULL,
  closes_at TIMESTAMP NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluator_groups (
  id SERIAL PRIMARY KEY,
  key VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(80) NOT NULL
);

CREATE TABLE evaluator_group_weights (
  evaluation_period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  evaluator_group_id INTEGER NOT NULL REFERENCES evaluator_groups(id),
  weight_percent NUMERIC(5,2) NOT NULL CHECK (weight_percent >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (evaluation_period_id, evaluator_group_id)
);

CREATE TABLE evaluation_forms (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  evaluator_group_id INTEGER NOT NULL REFERENCES evaluator_groups(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation_sections (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES evaluation_forms(id),
  title VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  category_key VARCHAR(80) NOT NULL
);

CREATE TABLE evaluation_questions (
  id UUID PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES evaluation_sections(id),
  prompt TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL
);

CREATE TABLE evaluation_question_options (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id),
  option_label VARCHAR(255) NOT NULL,
  option_value VARCHAR(80) NOT NULL,
  display_order INTEGER NOT NULL
);

-- Evaluation workflow
CREATE TABLE evaluation_assignments (
  id UUID PRIMARY KEY,
  evaluation_period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  evaluatee_id UUID NOT NULL REFERENCES users(id),
  evaluator_id UUID NOT NULL REFERENCES users(id),
  evaluator_group_id INTEGER NOT NULL REFERENCES evaluator_groups(id),
  course_id UUID REFERENCES courses(id),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (evaluation_period_id, evaluatee_id, evaluator_id, evaluator_group_id, course_id)
);

CREATE TABLE evaluation_submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL UNIQUE REFERENCES evaluation_assignments(id),
  submitted_at TIMESTAMP,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  anonymized_token UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation_responses (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES evaluation_submissions(id),
  question_id UUID NOT NULL REFERENCES evaluation_questions(id),
  response_numeric NUMERIC(5,2),
  response_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation_response_options (
  response_id UUID NOT NULL REFERENCES evaluation_responses(id),
  option_id UUID NOT NULL REFERENCES evaluation_question_options(id),
  PRIMARY KEY (response_id, option_id)
);

-- Analytics snapshots
CREATE TABLE evaluation_score_snapshots (
  id UUID PRIMARY KEY,
  evaluation_period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  evaluatee_id UUID NOT NULL REFERENCES users(id),
  category_key VARCHAR(80) NOT NULL,
  evaluator_group_id INTEGER NOT NULL REFERENCES evaluator_groups(id),
  score NUMERIC(5,2) NOT NULL,
  normalized_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation_overall_scores (
  id UUID PRIMARY KEY,
  evaluation_period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  evaluatee_id UUID NOT NULL REFERENCES users(id),
  overall_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Feedback loop
CREATE TABLE faculty_action_plans (
  id UUID PRIMARY KEY,
  evaluatee_id UUID NOT NULL REFERENCES users(id),
  evaluation_period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  summary TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications and audit logs
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(120) NOT NULL,
  target_id UUID,
  metadata JSONB,
  ip_address VARCHAR(60),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
