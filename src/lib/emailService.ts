/**
 * emailService.ts
 * Frontend email + job application service.
 * Communicates with the Node.js backend at /api/*.
 */

const API_BASE_URL = 'http://127.0.0.1:3001/api';

// ──────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface JobApplicationPayload {
  /** Job details */
  jobId: string;
  jobTitle: string;
  companyName: string;

  /** Candidate details */
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  coverLetter?: string;

  /** Optional links */
  resumeLink?: string;       // public URL after upload
  portfolioLink?: string;

  /** Optional: employer email for notification */
  employerEmail?: string;
}

export interface ApplicationResult {
  success: boolean;
  applicationId?: string;
  message: string;
}

// ──────────────────────────────────────────────
// Generic single email send (used by EmailPanel)
// ──────────────────────────────────────────────

export const sendEmail = async (
  emailData: EmailData
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!emailData.to || !emailData.subject || !emailData.text) {
      throw new Error('Missing required email fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      throw new Error('Invalid email address');
    }

    const response = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to send email');
    }

    const result = await response.json();
    return { success: true, message: result.message };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// ──────────────────────────────────────────────
// Fetch email log (for EmailPanel display)
// ──────────────────────────────────────────────

export const fetchEmails = async (): Promise<{ success: boolean; emails: unknown[] }> => {
  const response = await fetch(`${API_BASE_URL}/emails`);
  if (!response.ok) throw new Error('Failed to fetch email history');
  return response.json();
};

// ──────────────────────────────────────────────
// Job Application — main feature
// ──────────────────────────────────────────────

/**
 * Submit a job application.
 *
 * This function:
 *  1. POSTs to /api/apply with all applicant details
 *  2. The backend immediately saves the application and returns a response
 *  3. The backend then asynchronously sends:
 *     - A confirmation email to the candidate
 *     - A notification email to the employer (if email provided)
 *
 * The UI is NOT blocked waiting for emails to be sent.
 */
export const applyForJob = async (
  payload: JobApplicationPayload
): Promise<ApplicationResult> => {
  try {
    // Validate required fields before sending
    if (!payload.candidateName.trim() || !payload.candidateEmail.trim()) {
      return { success: false, message: 'Candidate name and email are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.candidateEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const response = await fetch(`${API_BASE_URL}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Failed to submit application.' };
    }

    return {
      success: true,
      applicationId: data.applicationId,
      message: data.message,
    };
  } catch (error) {
    console.error('Application submission error:', error);

    // Network/connection error — backend may be offline
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Cannot connect to server. Please ensure the backend is running.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
};

// ──────────────────────────────────────────────
// Employer notification (standalone helper)
// Kept for backwards compatibility with older code.
// Prefer using applyForJob() with employerEmail instead.
// ──────────────────────────────────────────────

export const sendApplicationNotification = async (
  employerEmail: string,
  applicantName: string,
  jobTitle: string
): Promise<{ success: boolean; message: string }> => {
  return sendEmail({
    to: employerEmail,
    subject: `New Application for ${jobTitle}`,
    text: `Dear Employer,\n\n${applicantName} has applied for the position: ${jobTitle}.\n\nPlease log in to your dashboard to review the application.\n\nBest regards,\nJob Portal Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Job Application</h2>
        <p>Dear Employer,</p>
        <p><strong>${applicantName}</strong> has applied for the position: <strong>${jobTitle}</strong>.</p>
        <p>Please log in to your dashboard to review the application.</p>
        <br>
        <p>Best regards,<br>Job Portal Team</p>
      </div>
    `,
  });
};