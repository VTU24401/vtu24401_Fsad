import { useState } from 'react';
import { Eye, EyeOff, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function Login() {
  const { signIn } = useAuth();
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      navigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white/20 p-2 rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Job Portal</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Your Career Journey<br />Starts Here
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            Access thousands of job opportunities across top companies. Connect with employers and take the next step in your career.
          </p>
          <div className="space-y-3">
            {[
              '10,000+ job listings across leading companies',
              'Top employers from Chennai to Coimbatore',
              'Easy one-click apply system',
              'Free for all job seekers',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Job Portal</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create one free
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
