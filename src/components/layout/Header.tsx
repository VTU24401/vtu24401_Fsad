import { useState } from 'react';
import { Briefcase, Menu, X, ChevronDown, User, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../context/ChatContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useApp();
  const { totalUnread } = useChat();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
    setUserMenuOpen(false);
  };

  const getDashboardPage = () => {
    if (!profile) return 'login';
    if (profile.role === 'employer') return 'employer-dashboard';
    if (profile.role === 'admin') return 'admin-dashboard';
    return 'seeker-dashboard';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 group"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-gray-900">Job Portal</span>
              <span className="text-xs text-gray-500 hidden sm:block">Your job search hub</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('home')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Home
            </button>
            <button
              onClick={() => navigate('jobs')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Find Jobs
            </button>
            <button
              onClick={() => navigate('contact')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Contact
            </button>
            {user && (
              <button
                onClick={() => navigate('chat')}
                className="relative text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                    {profile.full_name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{profile.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate(getDashboardPage()); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => { navigate('seeker-profile'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('login')}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('register')}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => { navigate('home'); setMobileOpen(false); }}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
            >
              Home
            </button>
            <button
              onClick={() => { navigate('jobs'); setMobileOpen(false); }}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
            >
              Find Jobs
            </button>
            <button
              onClick={() => { navigate('contact'); setMobileOpen(false); }}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
            >
              Contact
            </button>
            {user && (
              <button
                onClick={() => { navigate('chat'); setMobileOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                {totalUnread > 0 && (
                  <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
            )}
            <hr className="border-gray-100" />
            {user && profile ? (
              <>
                <button
                  onClick={() => { navigate(getDashboardPage()); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate('login'); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate('register'); setMobileOpen(false); }}
                  className="block w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
