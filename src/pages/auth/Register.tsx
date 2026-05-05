import { useState } from 'react';
import { Eye, EyeOff, Briefcase, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export default function Register() {
  const { signUp } = useAuth();
  const { navigate } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName, role);
    if (err) {
      setError(err.includes('already') ? 'An account with this email already exists.' : err);
      setLoading(false);
    } else {
      navigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Job Portal</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Create Your Account</h1>
          <p className="text-gray-500 text-sm mb-6 text-center">Join Job Portal — 100% free</p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'seeker' as UserRole, label: 'Job Seeker', desc: 'Find & apply for jobs', icon: User },
              { value: 'employer' as UserRole, label: 'Employer', desc: 'Post jobs & hire talent', icon: Building2 },
            ].map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  role === value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${role === value ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className={`font-semibold text-sm ${role === value ? 'text-blue-700' : 'text-gray-800'}`}>{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm mt-2"
            >
              {loading ? 'Creating account...' : `Create ${role === 'seeker' ? 'Job Seeker' : 'Employer'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </button>
          </p>

          <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
