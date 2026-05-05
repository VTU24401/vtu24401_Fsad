import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Building2, ArrowLeft, Bookmark, BookmarkCheck, Share2, CheckCircle, AlertCircle, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Job } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { applyForJob } from '../lib/emailService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { navigate, selectedJobId } = useApp();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantLocation, setApplicantLocation] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applicationError, setApplicationError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (selectedJobId) fetchJob();
  }, [selectedJobId]);

  const fetchJob = async () => {
    const fallbackJob = SAMPLE_JOBS.find(job => job.id === selectedJobId);
    const { data } = await supabase.from('jobs').select('*').eq('id', selectedJobId).maybeSingle();

    if (data) {
      setJob(data as Job);
      await supabase.from('jobs').update({ views_count: (data.views_count || 0) + 1 }).eq('id', selectedJobId);
    } else if (fallbackJob) {
      setJob(fallbackJob);
    }

    if (user) {
      const [{ data: saved }, { data: applied }] = await Promise.all([
        supabase.from('saved_jobs').select('id').eq('seeker_id', user.id).eq('job_id', selectedJobId!).maybeSingle(),
        supabase.from('applications').select('id').eq('seeker_id', user.id).eq('job_id', selectedJobId!).maybeSingle(),
      ]);
      setIsSaved(!!saved);
      setIsApplied(!!applied);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) { navigate('login'); return; }
    if (isSaved) {
      await supabase.from('saved_jobs').delete().eq('seeker_id', user.id).eq('job_id', job!.id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({ seeker_id: user.id, job_id: job!.id });
      setIsSaved(true);
    }
  };

  const handleApply = async () => {
    // Removed login check for demo purposes
    // if (!user || !profile) { navigate('login'); return; }
    // if (profile.role !== 'seeker') return;
    setApplicantName('John Doe'); // Default values for demo
    setApplicantEmail('john@example.com');
    setApplicantPhone('1234567890');
    setApplicantLocation(job?.location || '');
    setPortfolioLink('');
    setResumeFile(null);
    setApplicationError('');
    setCoverLetter('');
    setApplySuccess(false);
    setApplyModalOpen(true);
  };

  const submitApplication = async () => {
    if (!applicantName.trim() || !applicantEmail.trim() || !applicantPhone.trim()) {
      setApplicationError('Please provide your name, email, and phone number.');
      return;
    }

    if (!job) return;
    setApplying(true);
    setApplicationError('');

    const result = await applyForJob({
      jobId:             job.id,
      jobTitle:          job.title,
      companyName:       job.company_name,
      candidateName:     applicantName,
      candidateEmail:    applicantEmail,
      candidatePhone:    applicantPhone,
      candidateLocation: applicantLocation,
      coverLetter:       coverLetter,
      resumeLink:        profile?.resume_url || '',
      portfolioLink:     portfolioLink,
      // Pass employer email if available; backend skips employer email if absent
      employerEmail:     '',  // replace with job.employer_email when available in DB
    });

    setApplying(false);

    if (result.success) {
      setIsApplied(true);
      setApplySuccess(true);
      setApplyModalOpen(false);
    } else {
      setApplicationError(result.message);
    }
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Salary not disclosed';
    const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
    if (min && max) return `₹${fmt(min)} - ₹${fmt(max)} per year`;
    if (min) return `₹${fmt(min)}+ per year`;
    return `Up to ₹${fmt(max)} per year`;
  };

  const jobTypeColors: Record<string, string> = {
    'full-time': 'bg-blue-50 text-blue-700',
    'part-time': 'bg-amber-50 text-amber-700',
    'remote': 'bg-green-50 text-green-700',
    'contract': 'bg-orange-50 text-orange-700',
    'internship': 'bg-pink-50 text-pink-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Job not found</h2>
        <button onClick={() => navigate('jobs')} className="text-blue-600 hover:underline">Back to Jobs</button>
      </div>
    );
  }

  const companyLogo = job.company_name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('jobs')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-2xl font-bold text-blue-700">
            {companyLogo}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{job.category}</p>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-600 mt-1">{job.company_name}</p>
          </div>
        </div>

        {applySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Application is successfully submitted!</p>
              <p className="text-sm text-green-600">Your application has been sent to the employer.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                  <p className="text-blue-600 font-medium mt-1">{job.company_name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${jobTypeColors[job.job_type] || 'bg-gray-100 text-gray-600'}`}>
                      {job.job_type.replace('-', ' ')}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {job.experience_level} level
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {job.category}
                    </span>
                    {job.is_featured && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Featured</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                <button
                  onClick={isApplied ? undefined : handleApply}
                  disabled={isApplied}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    isApplied
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isApplied ? 'Applied' : 'Apply Now'}
                </button>
                <button
                  onClick={handleSave}
                  className={`p-2.5 rounded-xl border transition-colors ${isSaved ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200'}`}
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Skills */}
            {job.skills_required?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map(skill => (
                    <span key={skill} className="bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Benefits</h2>
                <div className="grid grid-cols-2 gap-2">
                  {job.benefits.map(benefit => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Job Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Category', value: job.category },
                  { label: 'Job Type', value: job.job_type.replace('-', ' '), capitalize: true },
                  { label: 'Experience', value: `${job.experience_years_min}-${job.experience_years_max} years` },
                  { label: 'Location', value: job.location },
                  { label: 'Salary', value: formatSalary(job.salary_min, job.salary_max) },
                  { label: 'Posted', value: new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Deadline', value: job.apply_deadline ? new Date(job.apply_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified' },
                ].map(({ label, value, capitalize }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-medium text-gray-800 text-right max-w-32 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Note</span>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Never pay any fee to apply for a job. Job Portal is free for all job seekers. Report suspicious postings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal - Changed to overlay for visibility */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Apply for {job.title}</h3>
                <p className="text-sm text-gray-500">{job.company_name} · {job.location}</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            {applicationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {applicationError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={e => setApplicantName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={e => setApplicantEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={e => setApplicantPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <input
                  type="text"
                  value={applicantLocation}
                  onChange={e => setApplicantLocation(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio / LinkedIn</label>
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={e => setPortfolioLink(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume</label>
                <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-700 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  <span>{resumeFile ? resumeFile.name : 'Choose a file (PDF or DOC)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {profile?.resume_filename && !resumeFile && (
                  <p className="mt-2 text-sm text-green-700">Using profile resume: {profile.resume_filename}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter (Optional)</label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setApplyModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={applying}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
