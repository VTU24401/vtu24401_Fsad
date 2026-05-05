import { MapPin, Clock, DollarSign } from 'lucide-react';
import { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onViewDetail: (jobId: string) => void;
  showApplyButton?: boolean;
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
}

const jobTypeColors: Record<string, string> = {
  'full-time': 'bg-blue-50 text-blue-700',
  'part-time': 'bg-amber-50 text-amber-700',
  'remote': 'bg-green-50 text-green-700',
  'contract': 'bg-orange-50 text-orange-700',
  'internship': 'bg-pink-50 text-pink-700',
};

function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(0)}L` : `${(n / 1000).toFixed(0)}K`;
  if (min && max) return `₹${fmt(min)} - ₹${fmt(max)}/yr`;
  if (min) return `₹${fmt(min)}+/yr`;
  return `Up to ₹${fmt(max)}/yr`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function JobCard({
  job,
  onViewDetail,
  showApplyButton,
  onApply,
  isApplied,
}: JobCardProps) {
  const logoText = job.company_name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-lg font-bold text-blue-700">
            {logoText}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">{job.category}</p>
            <h3 className="font-semibold text-gray-900 leading-tight text-lg">{job.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{job.company_name}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${jobTypeColors[job.job_type] || 'bg-gray-100 text-gray-600'}`}>
          {job.job_type.replace('-', ' ')}
        </span>
        {job.is_featured && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            Featured
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-1">{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span>{timeAgo(job.created_at)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onViewDetail(job.id)}
          className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
        >
          View Details
        </button>
        {showApplyButton && onApply && (
          <button
            onClick={() => !isApplied && onApply(job.id)}
            disabled={isApplied}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              isApplied
                ? 'bg-green-50 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isApplied ? 'Applied' : 'Apply Now'}
          </button>
        )}
      </div>
    </div>
  );
}
