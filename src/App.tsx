import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Header from './components/layout/Header';
import Home from './pages/Home.tsx';
import Jobs from './pages/Jobs.tsx';
import JobDetail from './pages/JobDetail.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Contact from './pages/Contact.tsx';
import Chat from './pages/Chat.tsx';
import Login from './pages/auth/Login.tsx';
import Register from './pages/auth/Register.tsx';

function AppContent() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'home':
      return <Home />;
    case 'jobs':
      return <Jobs />;
    case 'job-detail':
      return <JobDetail />;
    case 'seeker-dashboard':
    case 'employer-dashboard':
    case 'admin-dashboard':
      return <Dashboard />;
    case 'contact':
      return <Contact />;
    case 'chat':
      return <Chat />;
    case 'login':
      return <Login />;
    case 'register':
      return <Register />;
    default:
      return <Login />;
  }
}

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ChatProvider>
          <Header />
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;