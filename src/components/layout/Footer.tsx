import { Briefcase, MapPin, Mail, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Job Portal</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              A premier job portal connecting top talent with leading companies.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span>Chennai, India</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Mail className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span>support@jobportal.in</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span>+91 44 1234 5678</span>
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2">
              {[
                { label: 'Browse Jobs', page: 'jobs' as const },
                { label: 'Create Profile', page: 'register' as const },
                { label: 'My Applications', page: 'seeker-dashboard' as const },
                { label: 'Saved Jobs', page: 'seeker-saved' as const },
              ].map(item => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.page)}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2">
              {[
                { label: 'Post a Job', page: 'employer-post-job' as const },
                { label: 'Employer Dashboard', page: 'employer-dashboard' as const },
                { label: 'Browse Candidates', page: 'jobs' as const },
                { label: 'Register Company', page: 'register' as const },
              ].map(item => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.page)}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-white font-semibold mb-4">Top Cities</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'].map(city => (
                <button
                  key={city}
                  onClick={() => navigate('jobs')}
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors text-left"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2024 Job Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, label: 'Facebook' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Linkedin, label: 'LinkedIn' },
              { icon: Instagram, label: 'Instagram' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                aria-label={label}
                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
