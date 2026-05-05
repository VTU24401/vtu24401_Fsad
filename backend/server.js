const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { sendEmail, sendCandidateConfirmation, sendEmployerNotification } = require('./services/emailService');
const chat = require('./services/chatService');

const app = express();
const server = http.createServer(app);

// ✅ CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Socket.IO setup
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ──────────────────────────────────────────────
// In-memory stores
// ──────────────────────────────────────────────
const emailLog     = [];
const applications = [];

// Map: socketId → { userId, userName, userRole }
const socketUserMap = new Map();

// ══════════════════════════════════════════════
// SOCKET.IO — Real-time Chat
// ══════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // ── 1. User identification ───────────────────
  // Client must emit 'identify' right after connecting
  socket.on('identify', ({ userId, userName, userRole }) => {
    socketUserMap.set(socket.id, { userId, userName, userRole });
    chat.setOnline(userId);

    // Broadcast updated online list to everyone
    io.emit('online-users', chat.getOnlineUsers());
    console.log(`👤 ${userName} (${userRole}) identified | socket: ${socket.id}`);
  });

  // ── 2. Join a conversation room ──────────────
  socket.on('join-conversation', ({ conversationId, userId }) => {
    socket.join(conversationId);

    // Mark all existing messages as read when joining
    try { chat.markRead(conversationId, userId); } catch (_) {}

    // Send chat history to the joining user
    try {
      const history = chat.getMessages(conversationId, userId);
      socket.emit('chat-history', history);
    } catch (err) {
      socket.emit('chat-error', { message: err.message });
    }

    console.log(`📂 Socket ${socket.id} joined room: ${conversationId}`);
  });

  // ── 3. Leave a conversation room ─────────────
  socket.on('leave-conversation', ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // ── 4. Send message ──────────────────────────
  socket.on('send-message', ({ conversationId, senderId, senderName, senderRole, text }) => {
    if (!text?.trim()) return;

    try {
      const message = chat.addMessage({ conversationId, senderId, senderName, senderRole, text });

      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(conversationId).emit('receive-message', message);

      // Emit updated conversation preview to both participants
      const conv = chat.getConversationById(conversationId);
      if (conv) {
        [conv.candidateId, conv.employerId].forEach(uid => {
          const convList = chat.getConversationsForUser(uid);
          // Find the socket(s) belonging to uid and emit
          for (const [sid, meta] of socketUserMap.entries()) {
            if (meta.userId === uid) {
              io.to(sid).emit('conversations-updated', convList);
            }
          }
        });
      }

      console.log(`💬 [${conversationId}] ${senderName}: ${text.slice(0, 60)}`);
    } catch (err) {
      socket.emit('chat-error', { message: err.message });
    }
  });

  // ── 5. Typing indicator ──────────────────────
  socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
    // Broadcast to others in the room, not the sender
    socket.to(conversationId).emit('user-typing', { userId, userName, isTyping });
  });

  // ── 6. Mark messages read ────────────────────
  socket.on('mark-read', ({ conversationId, userId }) => {
    chat.markRead(conversationId, userId);
    // Notify sender that messages have been read
    socket.to(conversationId).emit('messages-read', { conversationId, readBy: userId });
  });

  // ── 7. Disconnection ─────────────────────────
  socket.on('disconnect', () => {
    const meta = socketUserMap.get(socket.id);
    if (meta) {
      // Only mark offline if no other socket from same user is connected
      const otherSocket = [...socketUserMap.entries()].find(
        ([sid, m]) => sid !== socket.id && m.userId === meta.userId
      );
      if (!otherSocket) {
        chat.setOffline(meta.userId);
        io.emit('online-users', chat.getOnlineUsers());
        console.log(`👋 ${meta.userName} went offline`);
      }
      socketUserMap.delete(socket.id);
    }
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// ══════════════════════════════════════════════
// REST API — Conversations
// ══════════════════════════════════════════════

/**
 * POST /api/conversations/start
 * Body: { jobId, jobTitle, candidateId, candidateName, employerId, employerName }
 * Creates (or retrieves) a conversation. Returns the conversation object.
 */
app.post('/api/conversations/start', (req, res) => {
  try {
    const { jobId, jobTitle, candidateId, candidateName, employerId, employerName } = req.body;

    if (!jobId || !candidateId || !employerId) {
      return res.status(400).json({ error: 'jobId, candidateId, and employerId are required.' });
    }

    const conversation = chat.getOrCreateConversation({
      jobId, jobTitle: jobTitle || 'Unknown Job',
      candidateId, candidateName: candidateName || 'Candidate',
      employerId, employerName: employerName || 'Employer',
    });

    res.json({ success: true, conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/conversations?userId=xxx
 * Returns all conversations for a user (candidate or employer).
 */
app.get('/api/conversations', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param required.' });

  const convs = chat.getConversationsForUser(userId);
  res.json({ success: true, conversations: convs });
});

/**
 * GET /api/conversations/:id
 * Returns a single conversation by ID.
 */
app.get('/api/conversations/:id', (req, res) => {
  const conv = chat.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
  res.json({ success: true, conversation: conv });
});

// ══════════════════════════════════════════════
// REST API — Messages
// ══════════════════════════════════════════════

/**
 * GET /api/conversations/:id/messages?userId=xxx
 * Returns all messages in a conversation (marks them read).
 */
app.get('/api/conversations/:id/messages', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param required.' });

  try {
    const msgs = chat.getMessages(req.params.id, userId);
    res.json({ success: true, messages: msgs });
  } catch (err) {
    res.status(err.message === 'Unauthorized' ? 403 : 404).json({ error: err.message });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Body: { senderId, senderName, senderRole, text }
 * Sends a message via REST (fallback if socket not available).
 */
app.post('/api/conversations/:id/messages', (req, res) => {
  const { senderId, senderName, senderRole, text } = req.body;
  if (!senderId || !text?.trim()) {
    return res.status(400).json({ error: 'senderId and text are required.' });
  }

  try {
    const message = chat.addMessage({
      conversationId: req.params.id,
      senderId, senderName, senderRole, text,
    });

    // Also broadcast via Socket.IO so real-time clients get it
    io.to(req.params.id).emit('receive-message', message);

    res.json({ success: true, message });
  } catch (err) {
    res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
  }
});

/**
 * GET /api/online-users
 * Returns list of currently online user IDs.
 */
app.get('/api/online-users', (req, res) => {
  res.json({ success: true, onlineUsers: chat.getOnlineUsers() });
});

// ══════════════════════════════════════════════
// EMAIL REST APIs (unchanged from before)
// ══════════════════════════════════════════════

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
    }
    const record = { id: Date.now(), to, subject, text, sentAt: new Date().toISOString(), status: 'queued' };
    emailLog.push(record);

    sendEmail({ to, subject, text, html })
      .then(r => { record.status = r.success ? 'sent' : `failed: ${r.error}`; })
      .catch(e => { record.status = `error: ${e.message}`; });

    res.json({ success: true, message: 'Email queued', data: record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to queue email' });
  }
});

app.get('/api/emails', (req, res) => res.json({ success: true, emails: emailLog }));

app.post('/api/apply', async (req, res) => {
  try {
    const {
      jobId, jobTitle, companyName,
      candidateName, candidateEmail, candidatePhone,
      candidateLocation, coverLetter, resumeLink, portfolioLink,
      // NEW fields for chat + employer email
      candidateId,
      employerId,
      employerName,
      employerEmail,
    } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!jobId || !jobTitle || !companyName) {
      return res.status(400).json({ error: 'Missing job details (jobId, jobTitle, companyName).' });
    }
    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ error: 'Candidate name and email are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail)) {
      return res.status(400).json({ error: 'Invalid candidate email address.' });
    }

    // Build stable IDs (use real userId if authenticated, else derive from email)
    const resolvedCandidateId = candidateId || `guest_${candidateEmail}`;
    const resolvedEmployerId  = employerId  || `employer_${jobId}`;
    const resolvedEmployerName = employerName || companyName || 'Employer';

    // ── Duplicate check ─────────────────────────────────────
    const alreadyApplied = applications.find(
      a => a.jobId === jobId && a.candidateEmail === candidateEmail
    );
    if (alreadyApplied) {
      // If already applied, return the existing conversationId so UI can still open chat
      console.log(`ℹ️  Duplicate apply: ${candidateName} → ${jobTitle}`);
      return res.status(409).json({
        error: 'You have already applied for this job.',
        conversationId: alreadyApplied.conversationId || null,
      });
    }

    // ── Save application ────────────────────────────────────
    const application = {
      id: `app_${Date.now()}`,
      jobId, jobTitle, companyName,
      candidateId: resolvedCandidateId,
      candidateName, candidateEmail,
      candidatePhone: candidatePhone || '',
      candidateLocation: candidateLocation || '',
      coverLetter: coverLetter || '',
      resumeLink: resumeLink || '',
      portfolioLink: portfolioLink || '',
      employerId: resolvedEmployerId,
      employerName: resolvedEmployerName,
      employerEmail: employerEmail || '',
      appliedAt: new Date().toISOString(),
      status: 'applied',
      conversationId: null,
      emailStatus: { candidate: 'pending', employer: 'pending' },
    };
    applications.push(application);
    console.log(`📋 [APPLY] Saved: ${application.id} | ${candidateName} → ${jobTitle}`);

    // ── Create/get conversation ─────────────────────────────
    let conversationId = null;
    let firstMessage   = null;
    try {
      const conversation = chat.getOrCreateConversation({
        jobId,
        jobTitle,
        candidateId:   resolvedCandidateId,
        candidateName,
        employerId:    resolvedEmployerId,
        employerName:  resolvedEmployerName,
      });
      conversationId = conversation.id;
      application.conversationId = conversationId;
      console.log(`💬 [CHAT] Conversation ready: ${conversationId}`);

      // Insert first message from candidate (only on brand-new conversations)
      const isNew = (conversation.lastMessage === null);
      if (isNew) {
        firstMessage = chat.addMessage({
          conversationId,
          senderId:   resolvedCandidateId,
          senderName: candidateName,
          senderRole: 'seeker',
          text: `Hi! I have applied for the ${jobTitle} position${coverLetter ? ' and included a cover letter' : ''}. I am very interested in this opportunity and look forward to hearing from you.`,
        });
        console.log(`💬 [CHAT] First message added to: ${conversationId}`);
      }
    } catch (chatErr) {
      console.error('❌ [CHAT] Failed to create conversation:', chatErr.message);
      // Don't block the apply — continue even if chat fails
    }

    // ── Respond immediately (UI not blocked) ────────────────
    res.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      conversationId,   // ← frontend uses this to open chat
    });

    // ── Emit socket events after response ───────────────────
    if (conversationId) {
      // Broadcast first message to anyone already in the room
      if (firstMessage) {
        io.to(conversationId).emit('receive-message', firstMessage);
      }

      // Push updated conversation lists to both candidate and employer
      [resolvedCandidateId, resolvedEmployerId].forEach(uid => {
        const updatedConvs = chat.getConversationsForUser(uid);
        for (const [sid, meta] of socketUserMap.entries()) {
          if (meta.userId === uid) {
            io.to(sid).emit('conversations-updated', updatedConvs);
          }
        }
      });
      console.log(`📡 [SOCKET] Conversation events emitted for: ${conversationId}`);
    }

    // ── Send emails asynchronously ───────────────────────────
    // Candidate confirmation
    sendCandidateConfirmation({
      candidateEmail, candidateName, jobTitle, companyName,
      applicationDate: application.appliedAt,
    }).then(r => {
      application.emailStatus.candidate = r.skipped ? 'skipped (not configured)' : r.success ? 'sent' : `failed: ${r.error}`;
      console.log(`📧 [EMAIL] Candidate (${candidateEmail}): ${application.emailStatus.candidate}`);
    }).catch(err => {
      application.emailStatus.candidate = `error: ${err.message}`;
      console.error('📧 [EMAIL] Candidate send error:', err.message);
    });

   // ✅ FIXED: Always send email (fallback to candidateEmail)
const finalEmployerEmail = employerEmail || candidateEmail;

if (finalEmployerEmail && emailRegex.test(finalEmployerEmail)) {
  sendEmployerNotification({
    employerEmail: finalEmployerEmail,
    candidateName,
    candidateEmail,
    jobTitle,
    resumeLink,
    portfolioLink,
    coverLetter,
  })
    .then(r => {
      application.emailStatus.employer = r.skipped
        ? 'skipped (not configured)'
        : r.success
        ? 'sent'
        : `failed: ${r.error}`;

      console.log(`📧 [EMAIL] Employer (${finalEmployerEmail}): ${application.emailStatus.employer}`);
    })
    .catch(err => {
      application.emailStatus.employer = `error: ${err.message}`;
      console.error('📧 [EMAIL] Employer send error:', err.message);
    });
} else {
  application.emailStatus.employer = 'failed (invalid email)';
  console.log(`📧 [EMAIL] Employer failed — invalid email`);
}

  } catch (err) {
    console.error('❌ [APPLY] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

app.get('/api/applications', (req, res) => res.json({ success: true, total: applications.length, applications }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ══════════════════════════════════════════════
// Start server
// ══════════════════════════════════════════════
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? 'configured' : '⚠️  not configured'}`);
  console.log(`💬 Chat: Socket.IO ready`);
});