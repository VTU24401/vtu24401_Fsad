/**
 * chatService.js
 * In-memory chat store for conversations and messages.
 * Replace with a real DB (MongoDB/PostgreSQL) in production.
 */

// conversations[id] = { id, jobId, jobTitle, candidateId, candidateName, employerId, employerName, createdAt, lastMessage, lastMessageAt }
const conversations = new Map();

// messages[conversationId] = [ { id, conversationId, senderId, senderName, senderRole, text, timestamp, readBy: Set } ]
const messages = new Map();

// onlineUsers: Set of userId strings
const onlineUsers = new Set();

// ── helpers ─────────────────────────────────────────────────

const makeConvId = (jobId, candidateId) => `conv_${jobId}_${candidateId}`;

// ── conversations ────────────────────────────────────────────

/**
 * Get or create a conversation between a candidate and employer for a job.
 */
const getOrCreateConversation = ({ jobId, jobTitle, candidateId, candidateName, employerId, employerName }) => {
  const id = makeConvId(jobId, candidateId);
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      jobId,
      jobTitle,
      candidateId,
      candidateName,
      employerId,
      employerName,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
    });
    messages.set(id, []);
  }
  return conversations.get(id);
};

/**
 * Get all conversations for a user (by their userId, either candidate or employer).
 */
const getConversationsForUser = (userId) => {
  return Array.from(conversations.values())
    .filter(c => c.candidateId === userId || c.employerId === userId)
    .map(c => ({
      ...c,
      unreadCount: getUnreadCount(c.id, userId),
    }))
    .sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });
};

const getConversationById = (id) => conversations.get(id) || null;

// ── messages ─────────────────────────────────────────────────

/**
 * Add a message to a conversation.
 */
const addMessage = ({ conversationId, senderId, senderName, senderRole, text }) => {
  const conv = conversations.get(conversationId);
  if (!conv) throw new Error('Conversation not found');

  // Security: only participants may send
  if (conv.candidateId !== senderId && conv.employerId !== senderId) {
    throw new Error('Unauthorized: you are not a participant in this conversation');
  }

  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    readBy: new Set([senderId]),   // sender has already "read" their own message
  };

  messages.get(conversationId).push(msg);

  // Update conversation preview
  conv.lastMessage = text.trim();
  conv.lastMessageAt = msg.timestamp;

  // Return a serializable version
  return serializeMessage(msg);
};

/**
 * Get all messages in a conversation (for a given requesting user).
 * Also marks all messages as read by that user.
 */
const getMessages = (conversationId, requestingUserId) => {
  const conv = conversations.get(conversationId);
  if (!conv) throw new Error('Conversation not found');
  if (conv.candidateId !== requestingUserId && conv.employerId !== requestingUserId) {
    throw new Error('Unauthorized');
  }

  const msgs = messages.get(conversationId) || [];
  // Mark all as read by this user
  msgs.forEach(m => m.readBy.add(requestingUserId));

  return msgs.map(serializeMessage);
};

/**
 * Mark a single message read by a user.
 */
const markRead = (conversationId, requestingUserId) => {
  const msgs = messages.get(conversationId) || [];
  msgs.forEach(m => m.readBy.add(requestingUserId));
};

/**
 * How many messages in conversationId have NOT been read by userId.
 */
const getUnreadCount = (conversationId, userId) => {
  const msgs = messages.get(conversationId) || [];
  return msgs.filter(m => !m.readBy.has(userId)).length;
};

// ── online presence ──────────────────────────────────────────

const setOnline  = (userId) => onlineUsers.add(userId);
const setOffline = (userId) => onlineUsers.delete(userId);
const isOnline   = (userId) => onlineUsers.has(userId);
const getOnlineUsers = () => Array.from(onlineUsers);

// ── serialization (strip Set → array) ────────────────────────

const serializeMessage = (msg) => ({
  id: msg.id,
  conversationId: msg.conversationId,
  senderId: msg.senderId,
  senderName: msg.senderName,
  senderRole: msg.senderRole,
  text: msg.text,
  timestamp: msg.timestamp,
  readBy: Array.from(msg.readBy),
});

module.exports = {
  getOrCreateConversation,
  getConversationsForUser,
  getConversationById,
  addMessage,
  getMessages,
  markRead,
  getUnreadCount,
  setOnline,
  setOffline,
  isOnline,
  getOnlineUsers,
};
