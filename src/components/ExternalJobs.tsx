import React, { useState, useEffect } from 'react';
import { MapPin, Building2, DollarSign, ExternalLink } from 'lucide-react';
import { fetchExternalJobs, ExternalJob } from '../lib/jobApiService';

interface ExternalJobsProps {
  query?: string;
  location?: string;
  limit?: number;
}

const ExternalJobs: React.FC<ExternalJobsProps> = ({ query, location, limit = 5 }) => {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const externalJobs = await fetchExternalJobs(query, location, limit);
        setJobs(externalJobs);
        setError(null);
      } catch (err) {
        setError('Failed to load external jobs');
        console.error('External jobs error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [query, location, limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No external jobs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">External Job Opportunities</h3>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
                {job.salary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {job.source && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {job.source}
                </span>
              )}
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {job.type && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                  {job.type}
                </span>
              )}
              {job.posted && (
                <span className="text-xs text-gray-500">
                  Posted {new Date(job.posted).toLocaleDateString()}
                </span>
              )}
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExternalJobs;