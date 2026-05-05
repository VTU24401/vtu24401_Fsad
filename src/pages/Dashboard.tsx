import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useApp();

  if (!user || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-4 text-gray-600">Please sign in to view your dashboard.</p>
        <button
          onClick={() => navigate('login')}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const title =
    profile.role === 'employer'
      ? 'Employer Dashboard'
      : profile.role === 'admin'
      ? 'Admin Dashboard'
      : 'Job Seeker Dashboard';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{profile.role} portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-3 text-gray-600 max-w-2xl">
              Welcome back, {profile.full_name || 'User'}. Use this page to manage your account,
              view jobs, and access your profile tools.
            </p>
          </div>
          <button
            onClick={() => navigate('jobs')}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          <p className="mt-3 text-sm text-gray-600">Manage your profile settings and update your contact details.</p>
          <div className="mt-5 space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Name:</span> {profile.full_name}</p>
            <p><span className="font-medium">Email:</span> {profile.email}</p>
            <p><span className="font-medium">Role:</span> {profile.role}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Activity</h2>
          <p className="mt-3 text-sm text-gray-600">Quick access to your recent activity and next steps.</p>
          <ul className="mt-5 space-y-3 text-sm text-gray-700">
            <li>- View available job listings</li>
            <li>- Track applications and saved jobs</li>
            <li>- Update your profile and preferences</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Support</h2>
          <p className="mt-3 text-sm text-gray-600">Need help? Reach out if you have questions or want to update your account.</p>
          <button
            onClick={() => navigate('contact')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
