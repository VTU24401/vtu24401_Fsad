import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CITIES, JOB_CATEGORIES, POPULAR_JOB_CATEGORIES } from '../types';

export default function Home() {
  const { navigate } = useApp();
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = () => {
    const searchParams = { keyword: jobTitle, city, category };
    sessionStorage.setItem('jobSearch', JSON.stringify(searchParams));
    navigate('jobs');
  };

  const handleCategorySelect = (categoryLabel: string) => {
    const searchParams = { keyword: '', city: '', category: categoryLabel };
    sessionStorage.setItem('jobSearch', JSON.stringify(searchParams));
    navigate('jobs');
  };

  const handleRegisterClick = () => {
    navigate('register');
  };

  const handleApplyClick = (jobTitle: string) => {
    if (!user) {
      navigate('login');
    } else {
      // You can navigate to job detail or show apply modal here
      alert(`Applied for ${jobTitle}. Implementation pending.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}

      {/* Hero */}
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Find Your Dream Job with Job Portal
        </h2>
        <p className="text-lg mb-8">
          Search jobs from top companies across Chennai, Coimbatore, Madurai and more.
        </p>

        <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow">
          <input
            type="text"
            placeholder="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="border px-3 py-3 rounded-lg text-black"
          />

          <select 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border px-3 py-3 rounded-lg text-black"
          >
            <option value="">All Cities</option>
            {CITIES.map(cityName => (
              <option key={cityName} value={cityName}>{cityName}</option>
            ))}
          </select>

          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border px-3 py-3 rounded-lg text-black"
          >
            <option value="">All Categories</option>
            {JOB_CATEGORIES.map(categoryName => (
              <option key={categoryName} value={categoryName}>{categoryName}</option>
            ))}
          </select>

          <button 
            onClick={handleSearch}
            className="bg-blue-700 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-800 transition"
          >
            Search
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="500+" subtitle="Jobs" />
          <Card title="200+" subtitle="Companies" />
          <Card title="10K+" subtitle="Job Seekers" />
          <Card title="5000+" subtitle="Placements" />
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-700 font-semibold">Popular categories</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-3">
                Browse jobs by top industry demand
              </h2>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Discover trending career paths and explore live openings across categories.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_JOB_CATEGORIES.map(category => (
              <button
                key={category.label}
                type="button"
                onClick={() => handleCategorySelect(category.label)}
                className="group overflow-hidden rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition text-left"
              >
                <div className={`h-24 flex items-center justify-center ${category.color} bg-gradient-to-r`}>
                  <span className="text-3xl font-bold text-white">{category.logo}</span>
                </div>
                <div className="p-5 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Featured Jobs
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <JobCard
              title="Software Engineer"
              company="TCS"
              city="Chennai"
              salary="₹6 LPA"
              category="Information Technology"
              onApply={() => handleApplyClick('Software Engineer')}
            />

            <JobCard
              title="HR Executive"
              company="Infosys"
              city="Coimbatore"
              salary="₹4 LPA"
              category="Human Resources"
              onApply={() => handleApplyClick('HR Executive')}
            />

            <JobCard
              title="Marketing Manager"
              company="Zoho"
              city="Madurai"
              salary="₹7 LPA"
              category="Marketing & Digital"
              onApply={() => handleApplyClick('Marketing Manager')}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-white py-16 text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Career Journey?
        </h2>

        <p className="mb-6">
          Join thousands of candidates already using Job Portal.
        </p>

        <button 
          onClick={handleRegisterClick}
          className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
        >
          Create Free Account
        </button>
      </section>
    </div>
  );
}

function Card(props: { title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow text-center">
      <h3 className="text-2xl font-bold text-blue-700">{props.title}</h3>
      <p className="text-gray-600">{props.subtitle}</p>
    </div>
  );
}

function JobCard(props: {
  title: string;
  company: string;
  city: string;
  category: string;
  salary: string;
  onApply: () => void;
}) {
  const logoText = props.company
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-lg font-bold text-blue-700">
            {logoText}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">{props.category}</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">{props.title}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 uppercase tracking-[0.2em] mb-2">{props.company}</p>
        <p className="text-gray-700">{props.city}</p>
        <p className="text-blue-700 font-semibold mt-3">{props.salary}</p>

        <button 
          onClick={props.onApply}
          className="mt-4 w-full bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}