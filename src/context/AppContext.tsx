import { createContext, useContext, useState, ReactNode } from 'react';
import { Page } from '../types';

interface AppContextType {
  currentPage: Page;
  selectedJobId: string | null;
  selectedEmployerJobId: string | null;
  navigate: (page: Page, jobId?: string) => void;
  navigateEmployerJob: (jobId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedEmployerJobId, setSelectedEmployerJobId] = useState<string | null>(null);

  const navigate = (page: Page, jobId?: string) => {
    setCurrentPage(page);
    if (jobId) setSelectedJobId(jobId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateEmployerJob = (jobId: string) => {
    setSelectedEmployerJobId(jobId);
    setCurrentPage('employer-applicants');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider value={{ currentPage, selectedJobId, selectedEmployerJobId, navigate, navigateEmployerJob }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
