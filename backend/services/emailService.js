/**
 * emailService.js
 * Reusable email service module using Nodemailer (SMTP / Gmail).
 * All credentials are loaded from environment variables — never hard-coded.
 */

const nodemailer = require('nodemailer');

// ──────────────────────────────────────────────
// Credential check helper
// ──────────────────────────────────────────────
const PLACEHOLDER_VALUES = [
  'your_gmail@gmail.com',
  'your_16_char_app_password',
  '',
  undefined,
  null,
];

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return (
    !PLACEHOLDER_VALUES.includes(user) &&
    !PLACEHOLDER_VALUES.includes(pass)
  );
};

// ──────────────────────────────────────────────
// Transporter (created once, reused across calls)
// ──────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

// ──────────────────────────────────────────────
// Core send function
// ──────────────────────────────────────────────
/**
 * Send an email.
 * @param {Object} options
 * @param {string}  options.to       - Recipient address
 * @param {string}  options.subject  - Email subject
 * @param {string}  options.text     - Plain-text fallback
 * @param {string}  [options.html]   - HTML body (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // ── Guard: skip if SMTP not properly configured ──
  if (!isEmailConfigured()) {
    console.warn(`⚠️  [EMAIL SKIPPED] SMTP not configured. To: ${to} | Subject: ${subject}`);
    console.warn('   → Set EMAIL_USER and EMAIL_PASS in backend/.env with real credentials.');
    console.warn('   → For Gmail: use a 16-char App Password (not your regular password).');
    console.warn('   → Google Account → Security → 2-Step Verification → App Passwords');
    return { success: false, skipped: true, error: 'SMTP not configured' };
  }

  try {
    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ [EMAIL SENT] To: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Detailed error logging
    console.error(`❌ [EMAIL FAILED] To: ${to}`);
    console.error(`   Subject: ${subject}`);
    console.error(`   Error: ${err.message}`);
    if (err.message.includes('Username and Password')) {
      console.error('   → Fix: Your Gmail password is WRONG. Use an App Password, not your real password.');
      console.error('   → Google Account → Security → 2-Step Verification → App Passwords');
      // Reset transporter so it reconnects on next attempt after credentials are fixed
      transporter = null;
    }
    return { success: false, error: err.message };
  }
};

// ──────────────────────────────────────────────
// Candidate confirmation email
// ──────────────────────────────────────────────
/**
 * Send an application confirmation email to the candidate.
 * @param {Object} p
 * @param {string} p.candidateEmail
 * @param {string} p.candidateName
 * @param {string} p.jobTitle
 * @param {string} p.companyName
 * @param {string} p.applicationDate  - ISO string or formatted date
 */
const sendCandidateConfirmation = async ({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
  applicationDate,
}) => {
  const formattedDate = new Date(applicationDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return sendEmail({
    to: candidateEmail,
    subject: `✅ Application Submitted — ${jobTitle} at ${companyName}`,
    text: `
Hi ${candidateName},

Your application has been successfully submitted!

Job Title    : ${jobTitle}
Company      : ${companyName}
Applied On   : ${formattedDate}

We have forwarded your details to the hiring team.
You will hear back from them if your profile is shortlisted.

Good luck!
— Job Portal Team
    `.trim(),
    html: candidateEmailTemplate({ candidateName, jobTitle, companyName, formattedDate }),
  });
};

// ──────────────────────────────────────────────
// Employer notification email
// ──────────────────────────────────────────────
/**
 * Send a new-application notification to the employer.
 * @param {Object} p
 * @param {string} p.employerEmail
 * @param {string} p.candidateName
 * @param {string} p.candidateEmail
 * @param {string} p.jobTitle
 * @param {string} [p.resumeLink]     - Public URL to resume (optional)
 * @param {string} [p.portfolioLink]  - Portfolio / LinkedIn URL (optional)
 * @param {string} [p.coverLetter]    - Cover letter text (optional)
 */
const sendEmployerNotification = async ({
  employerEmail,
  candidateName,
  candidateEmail,
  jobTitle,
  resumeLink,
  portfolioLink,
  coverLetter,
}) => {
  return sendEmail({
    to: employerEmail,
    subject: `📩 New Application: ${candidateName} applied for ${jobTitle}`,
    text: `
Hi,

A new candidate has applied for your job posting!

Candidate   : ${candidateName}
Email       : ${candidateEmail}
Position    : ${jobTitle}
${resumeLink   ? `Resume      : ${resumeLink}`   : ''}
${portfolioLink ? `Portfolio   : ${portfolioLink}` : ''}
${coverLetter  ? `\nCover Letter:\n${coverLetter}` : ''}

Please log in to your dashboard to review and respond to this application.

— Job Portal Team
    `.trim(),
    html: employerEmailTemplate({
      candidateName,
      candidateEmail,
      jobTitle,
      resumeLink,
      portfolioLink,
      coverLetter,
    }),
  });
};

// ──────────────────────────────────────────────
// HTML Email Templates
// ──────────────────────────────────────────────

const candidateEmailTemplate = ({ candidateName, jobTitle, companyName, formattedDate }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Application Submitted</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:40px 40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">💼</span>
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Application Submitted!</h1>
              <p style="color:#bfdbfe;font-size:14px;margin:8px 0 0;">You're one step closer to your dream job</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi <strong>${candidateName}</strong>,</p>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Your application has been <strong style="color:#059669;">successfully submitted</strong>.
                The hiring team at <strong>${companyName}</strong> will review your profile and get in touch if you're shortlisted.
              </p>

              <!-- Application Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Application Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6b7280;font-size:14px;">Job Title</span>
                        </td>
                        <td style="padding:6px 0;text-align:right;">
                          <strong style="color:#111827;font-size:14px;">${jobTitle}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #e0f2fe;">
                          <span style="color:#6b7280;font-size:14px;">Company</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #e0f2fe;text-align:right;">
                          <strong style="color:#111827;font-size:14px;">${companyName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #e0f2fe;">
                          <span style="color:#6b7280;font-size:14px;">Applied On</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #e0f2fe;text-align:right;">
                          <strong style="color:#111827;font-size:14px;">${formattedDate}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:999px;padding:6px 16px;">
                    <span style="color:#065f46;font-size:13px;font-weight:600;">✓ Submitted Successfully</span>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
                Good luck with your application! In the meantime, explore more opportunities on our portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Job Portal · You're receiving this because you applied for a job.<br/>
                <a href="#" style="color:#6b7280;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const employerEmailTemplate = ({
  candidateName, candidateEmail, jobTitle, resumeLink, portfolioLink, coverLetter,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Application</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">📩</div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">New Candidate Applied!</h1>
              <p style="color:#ddd6fe;font-size:14px;margin:8px 0 0;">A candidate has applied for your job posting</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px;">
                A new candidate has applied for your job posting.
                Please review the application details below and respond from your employer dashboard.
              </p>

              <!-- Candidate Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="color:#7c3aed;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Candidate Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6b7280;font-size:14px;">Name</span>
                        </td>
                        <td style="padding:6px 0;text-align:right;">
                          <strong style="color:#111827;font-size:14px;">${candidateName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:14px;">Email</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;text-align:right;">
                          <a href="mailto:${candidateEmail}" style="color:#7c3aed;font-size:14px;text-decoration:none;">${candidateEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:14px;">Applied For</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;text-align:right;">
                          <strong style="color:#111827;font-size:14px;">${jobTitle}</strong>
                        </td>
                      </tr>
                      ${resumeLink ? `
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:14px;">Resume</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;text-align:right;">
                          <a href="${resumeLink}" style="color:#7c3aed;font-size:14px;text-decoration:none;">📎 View Resume</a>
                        </td>
                      </tr>` : ''}
                      ${portfolioLink ? `
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;">
                          <span style="color:#6b7280;font-size:14px;">Portfolio</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #ede9fe;text-align:right;">
                          <a href="${portfolioLink}" style="color:#7c3aed;font-size:14px;text-decoration:none;">${portfolioLink}</a>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              ${coverLetter ? `
              <!-- Cover Letter -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="color:#374151;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Cover Letter</p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0;white-space:pre-line;">${coverLetter}</p>
                  </td>
                </tr>
              </table>` : ''}

              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
                Please log in to your <strong>Employer Dashboard</strong> to shortlist, schedule an interview, or reject this application.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Job Portal · You're receiving this as a registered employer.<br/>
                <a href="#" style="color:#6b7280;text-decoration:none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { sendEmail, sendCandidateConfirmation, sendEmployerNotification };
