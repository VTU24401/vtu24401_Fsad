import { useState, useEffect } from 'react';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Job, CITIES, JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, POPULAR_JOB_CATEGORIES } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import JobCard from '../components/jobs/JobCard';
import ExternalJobs from '../components/ExternalJobs';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Jobs() {
  const { navigate } = useApp();
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    category: '',
    jobType: '',
    experienceLevel: '',
    salaryMin: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('jobSearch');
    if (saved) {
      const { keyword, city, category } = JSON.parse(saved);
      setFilters(prev => ({ ...prev, keyword: keyword || '', city: city || '', category: category || '' }));
      sessionStorage.removeItem('jobSearch');
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('jobs').select('*', { count: 'exact' }).eq('status', 'approved');

      if (filters.keyword) {
        const keywordQuery = `%${filters.keyword}%`;

        if (filters.city) {
          query = query.ilike('title', keywordQuery);
        } else {
          query = query.or(`title.ilike.${keywordQuery},location.ilike.${keywordQuery}`);
        }
      }
      if (filters.city) {
        query = query.ilike('location', `%${filters.city}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType);
      }
      if (filters.experienceLevel) {
        query = query.eq('experience_level', filters.experienceLevel);
      }

      if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sortBy === 'featured') {
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, count, error } = await query.limit(20);
      
      if (error) throw error;

      // If no data from database, use sample jobs for demo
      let jobsToUse = (data as Job[]) || [];
      let countToUse = count || 0;

      if (jobsToUse.length === 0) {
        // Filter sample jobs based on current filters
        jobsToUse = SAMPLE_JOBS.filter(job => {
          if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            const matchesTitle = job.title.toLowerCase().includes(keyword);
            const matchesLocation = job.location.toLowerCase().includes(keyword);
            if (!matchesTitle && !matchesLocation) return false;
          }
          if (filters.city && !job.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
          if (filters.category && job.category !== filters.category) return false;
          if (filters.jobType && job.job_type !== filters.jobType) return false;
          if (filters.experienceLevel && job.experience_level !== filters.experienceLevel) return false;
          return true;
        });
        
        // Apply sorting
        if (filters.sortBy === 'featured') {
          jobsToUse.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        }
        
        countToUse = jobsToUse.length;
      }

      setJobs(jobsToUse);
      setTotalCount(countToUse);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to sample jobs in case of error
      setJobs(SAMPLE_JOBS);
      setTotalCount(SAMPLE_JOBS.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    const { data } = await supabase.from('applications').select('job_id').eq('seeker_id', user!.id);
    setAppliedJobIds(new Set(data?.map(a => a.job_id) || []));
  };

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ keyword: '', city: '', category: '', jobType: '', experienceLevel: '', salaryMin: '', sortBy: 'newest' });
  };

  const activeFilterCount = [filters.city, filters.category, filters.jobType, filters.experienceLevel].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or location"
                value={filters.keyword}
                onChange={e => updateFilter('keyword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchJobs()}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="relative hidden sm:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.city}
                onChange={e => updateFilter('city', e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 appearance-none bg-white w-40"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-lg transition-colors ${
                activeFilterCount > 0 || showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={filters.category}
                  onChange={e => updateFilter('category', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">All Categories</option>
                  {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={filters.jobType}
                  onChange={e => updateFilter('jobType', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">All Types</option>
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select
                  value={filters.experienceLevel}
                  onChange={e => updateFilter('experienceLevel', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">All Levels</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select
                  value={filters.sortBy}
                  onChange={e => updateFilter('sortBy', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="featured">Featured First</option>
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-2 flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      <section className="bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top categories</h2>
              <p className="text-gray-600 mt-2">Tap a category to filter jobs instantly.</p>
            </div>
            <div className="text-sm text-gray-500">Showing live openings from our popular categories.</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_JOB_CATEGORIES.slice(0, 6).map(category => (
              <button
                key={category.label}
                onClick={() => updateFilter('category', category.label)}
                className={`group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none ${filters.category === category.label ? 'ring-2 ring-blue-500' : ''}`}
                type="button"
              >
                <div className={`h-24 flex items-center justify-center ${category.color} bg-gradient-to-r`}>
                  <span className="text-3xl font-bold text-white">{category.logo}</span>
                </div>
                <div className="p-3 text-left">
                  <p className="text-sm font-semibold text-gray-900">{category.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {loading ? 'Searching...' : `${totalCount} Jobs Found`}
            </h1>
            {(filters.keyword || filters.city) && (
              <p className="text-sm text-gray-500">
                {filters.keyword && <span>"{filters.keyword}" </span>}
                {filters.city && <span>in {filters.city}</span>}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No jobs found</h3>
            <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetail={id => navigate('job-detail', id)}
                showApplyButton={profile?.role === 'seeker'}
                onApply={id => navigate('job-detail', id)}
                isApplied={appliedJobIds.has(job.id)}
              />
            ))}
          </div>
        )}

        {/* External Jobs Section */}
        <div className="mt-12">
          <ExternalJobs query={filters.keyword} location={filters.city} limit={6} />
        </div>
      </div>
    </div>
  );
}
