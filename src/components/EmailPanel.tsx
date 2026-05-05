import { useEffect, useState } from 'react';
import { sendEmail, fetchEmails } from '../lib/emailService';

const EmailPanel = () => {
  const [to, setTo] = useState('recipient@example.com');
  const [subject, setSubject] = useState('Job application received');
  const [text, setText] = useState('Hello, your application was received. We will review it shortly.');
  const [statusMessage, setStatusMessage] = useState('');
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEmails = async () => {
    try {
      const data = await fetchEmails();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Email load error:', error);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleSend = async () => {
    setStatusMessage('Sending...');
    const result = await sendEmail({ to, subject, text });
    if (result.success) {
      setStatusMessage('Email sent successfully.');
      loadEmails();
    } else {
      setStatusMessage(`Error: ${result.message}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Email Send / Receive Demo</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Send Email
          </button>
          <span className="text-sm text-gray-600">{statusMessage}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Sent Email Log</h3>
        <div className="space-y-3">
          {emails.length === 0 ? (
            <p className="text-sm text-gray-500">No emails sent yet.</p>
          ) : (
            emails.map(email => (
              <div key={email.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">To: {email.to}</p>
                <p className="text-sm text-gray-600">Subject: {email.subject}</p>
                <p className="text-sm text-gray-500 mt-2">{email.text}</p>
                <p className="text-xs text-gray-400 mt-2">Status: {email.status} · {new Date(email.sentAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPanel;
