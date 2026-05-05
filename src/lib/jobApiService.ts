// Third-party job API service
const API_BASE_URL = 'http://localhost:3001/api';

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  type?: string;
  posted?: string;
  source?: string;
}

export interface JobSearchParams {
  q?: string; // search query
  location?: string;
  radius?: number;
  sort?: 'relevance' | 'date';
}

export interface JobSearchResponse {
  success: boolean;
  jobs: ExternalJob[];
  total: number;
  sources: string[];
}

// Fetch jobs from external APIs
export const fetchExternalJobs = async (
  query?: string,
  location?: string,
  limit: number = 10
): Promise<ExternalJob[]> => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (location) params.append('location', location);
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/external-jobs?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch external jobs');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error('External jobs fetch error:', error);
    throw error;
  }
};

// Comprehensive job search across multiple platforms
export const searchJobs = async (params: JobSearchParams): Promise<JobSearchResponse> => {
  try {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.append('q', params.q);
    if (params.location) searchParams.append('location', params.location);
    if (params.radius) searchParams.append('radius', params.radius.toString());
    if (params.sort) searchParams.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/job-search?${searchParams}`);

    if (!response.ok) {
      throw new Error('Job search failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Search request failed');
    }

    return data;
  } catch (error) {
    console.error('Job search error:', error);
    throw error;
  }
};

// Example usage functions
export const getRemoteJobs = async (): Promise<ExternalJob[]> => {
  return fetchExternalJobs('remote', '', 20);
};

export const getJobsByLocation = async (location: string): Promise<ExternalJob[]> => {
  return fetchExternalJobs('', location, 15);
};

export const getTechJobs = async (): Promise<ExternalJob[]> => {
  return fetchExternalJobs('software engineer OR developer', '', 25);
};