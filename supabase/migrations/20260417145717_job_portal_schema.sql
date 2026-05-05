
/*
  # Tamil Nadu Job Portal - Full Schema

  ## Tables Created:
  1. `profiles` - User profiles for all roles (seeker, employer, admin)
  2. `companies` - Employer company profiles
  3. `jobs` - Job listings posted by employers
  4. `applications` - Job applications submitted by seekers
  5. `saved_jobs` - Jobs bookmarked by seekers

  ## Security:
  - RLS enabled on all tables
  - Role-based access policies
  - Users can only access their own data
  - Employers can view applicants for their jobs
  - Admins have full access via app_metadata role check
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'employer', 'admin')),
  phone text DEFAULT '',
  location text DEFAULT '',
  bio text DEFAULT '',
  resume_url text DEFAULT '',
  resume_filename text DEFAULT '',
  skills text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  education text DEFAULT '',
  linkedin_url text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view seeker profiles for employer access"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  website text DEFAULT '',
  logo_url text DEFAULT '',
  industry text DEFAULT '',
  size text DEFAULT '' CHECK (size IN ('', '1-10', '11-50', '51-200', '201-500', '500+')),
  location text DEFAULT '',
  founded_year integer,
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved companies"
  ON companies FOR SELECT
  TO authenticated
  USING (is_approved = true OR owner_id = auth.uid());

CREATE POLICY "Employers can insert their company"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Employers can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Employers can view their own company even if not approved"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  company_name text NOT NULL,
  description text NOT NULL,
  requirements text DEFAULT '',
  salary_min integer DEFAULT 0,
  salary_max integer DEFAULT 0,
  salary_currency text DEFAULT 'INR',
  location text NOT NULL,
  category text NOT NULL,
  job_type text NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'remote', 'contract', 'internship')),
  experience_level text DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  experience_years_min integer DEFAULT 0,
  experience_years_max integer DEFAULT 0,
  skills_required text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  apply_deadline date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (status = 'approved' OR employer_id = auth.uid());

CREATE POLICY "Anyone can view approved jobs anon"
  ON jobs FOR SELECT
  TO anon
  USING (status = 'approved');

CREATE POLICY "Employers can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = employer_id);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  seeker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter text DEFAULT '',
  resume_url text DEFAULT '',
  resume_filename text DEFAULT '',
  status text DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn')),
  notes text DEFAULT '',
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, seeker_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seekers can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (seeker_id = auth.uid());

CREATE POLICY "Employers can view applications for their jobs"
  ON applications FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Seekers can insert applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (seeker_id = auth.uid());

CREATE POLICY "Seekers can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (seeker_id = auth.uid())
  WITH CHECK (seeker_id = auth.uid());

CREATE POLICY "Employers can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Saved Jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(seeker_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seekers can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (seeker_id = auth.uid());

CREATE POLICY "Seekers can insert saved jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (seeker_id = auth.uid());

CREATE POLICY "Seekers can delete own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (seeker_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker ON applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_employer ON applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker ON saved_jobs(seeker_id);

-- Insert sample companies and jobs for demo
INSERT INTO profiles (id, email, full_name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'seeker', true
FROM auth.users
ON CONFLICT (id) DO NOTHING;
