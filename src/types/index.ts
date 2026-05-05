export type UserRole = 'seeker' | 'employer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  location: string;
  bio: string;
  resume_url: string;
  resume_filename: string;
  skills: string[];
  experience_years: number;
  education: string;
  linkedin_url: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  website: string;
  logo_url: string;
  industry: string;
  size: string;
  location: string;
  founded_year: number | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type JobType = 'full-time' | 'part-time' | 'remote' | 'contract' | 'internship';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

export interface Job {
  id: string;
  employer_id: string;
  company_id: string | null;
  title: string;
  company_name: string;
  description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  location: string;
  category: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  experience_years_min: number;
  experience_years_max: number;
  skills_required: string[];
  benefits: string[];
  apply_deadline: string | null;
  status: JobStatus;
  views_count: number;
  applications_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'shortlisted'
  | 'interviewed'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  job_id: string;
  seeker_id: string;
  employer_id: string;
  cover_letter: string;
  resume_url: string;
  resume_filename: string;
  status: ApplicationStatus;
  notes: string;
  applied_at: string;
  updated_at: string;
  job?: Job;
  seeker?: Profile;
}

export interface SavedJob {
  id: string;
  seeker_id: string;
  job_id: string;
  saved_at: string;
  job?: Job;
}

export const CITIES = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Trichy',
  'Salem',
  'Tirunelveli',
  'Erode',
  'Vellore',
  'Tiruppur',
  'Thanjavur',
  'Dindigul',
  'Kanchipuram',
  'Nagercoil',
  'Kumbakonam',
  'Hosur',
  'Remote',
];

export const JOB_CATEGORIES = [
  'Information Technology',
  'Software Engineering',
  'Data Science & Analytics',
  'Marketing & Digital',
  'Finance & Accounting',
  'Human Resources',
  'Sales & Business Development',
  'Customer Support',
  'Operations & Logistics',
  'Manufacturing',
  'Healthcare & Medical',
  'Education & Training',
  'Design & Creative',
  'Legal & Compliance',
  'Civil & Construction',
  'Automobile & Engineering',
  'Retail & E-commerce',
  'Hospitality & Tourism',
  'Media & Journalism',
  'Research & Development',
  'Artificial Intelligence & Machine Learning',
  'Supply Chain & Procurement',
  'Energy & Utilities',
  'Real Estate & Property',
  'Beauty & Wellness',
  'Sports & Fitness',
];

export const POPULAR_JOB_CATEGORIES = [
  {
    label: 'Software Engineering',
    description: 'Build scalable web and mobile applications.',
    logo: 'SE',
    color: 'from-sky-500 to-blue-600',
  },
  {
    label: 'Data Science & Analytics',
    description: 'Turn data into business insights.',
    logo: 'DA',
    color: 'from-violet-500 to-purple-700',
  },
  {
    label: 'Marketing & Digital',
    description: 'Create campaigns that grow brands.',
    logo: 'MD',
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    label: 'Human Resources',
    description: 'Manage people, culture, and hiring.',
    logo: 'HR',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Finance & Accounting',
    description: 'Support strategic financial decisions.',
    logo: 'FA',
    color: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Design & Creative',
    description: 'Craft interfaces, branding, and visual stories.',
    logo: 'DC',
    color: 'from-cyan-500 to-sky-600',
  },
];

export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'remote', label: 'Remote' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-8 years)' },
  { value: 'lead', label: 'Lead (8-12 years)' },
  { value: 'executive', label: 'Executive (12+ years)' },
];

export type Page =
  | 'home'
  | 'jobs'
  | 'job-detail'
  | 'login'
  | 'register'
  | 'contact'
  | 'chat'
  | 'seeker-dashboard'
  | 'seeker-profile'
  | 'seeker-saved'
  | 'employer-dashboard'
  | 'admin-dashboard'
  | 'employer-post-job'
  | 'employer-applicants'
  | 'employer-edit-job';
