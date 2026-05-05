import { useApp } from '../context/AppContext';
import EmailPanel from '../components/EmailPanel';
import ChatBox from '../components/ChatBox';

export default function Contact() {
  const { navigate } = useApp();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <button
          onClick={() => navigate('home')}
          className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Home
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">Contact Us</h1>
        <p className="mt-4 text-gray-600 max-w-2xl">
          Need assistance with your job search or account? Reach out to our support team and we will get back to you shortly.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-blue-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Support</p>
            <p className="mt-3 text-lg font-semibold text-gray-900">support@indiajobportal.com</p>
            <p className="mt-2 text-gray-600">For product help, login issues, or feature requests.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-600">Phone</p>
            <p className="mt-3 text-lg font-semibold text-gray-900">+91 98765 43210</p>
            <p className="mt-2 text-gray-600">Available Monday to Friday, 9AM to 6PM IST.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EmailPanel />
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Chat Demo</h2>
          <ChatBox roomId="contact-room" currentUserId="user-123" currentUserName="Candidate" />
        </div>
      </div>
    </div>
  );
}
