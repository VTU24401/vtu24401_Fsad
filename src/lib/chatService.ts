/**
 * chatService.ts
 * Frontend API client + Socket.IO wrapper for real-time chat.
 */
import { io, Socket } from 'socket.io-client';

const API = 'http://127.0.0.1:3001/api';
const SOCKET_URL = 'http://127.0.0.1:3001';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface Conversation {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  employerId: string;
  employerName: string;
  createdAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  readBy: string[];
}

export interface StartConversationParams {
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  employerId: string;
  employerName: string;
}

// ─────────────────────────────────────────────
// Socket singleton
// ─────────────────────────────────────────────
let _socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!_socket || !_socket.connected) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return _socket;
};

export const disconnectSocket = () => {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
};

// ─────────────────────────────────────────────
// REST API helpers
// ─────────────────────────────────────────────

/** Start or get an existing conversation */
export const startConversation = async (
  params: StartConversationParams
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> => {
  try {
    const res = await fetch(`${API}/conversations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, conversation: data.conversation };
  } catch (err) {
    return { success: false, error: 'Cannot connect to server.' };
  }
};

/** Fetch all conversations for a user */
export const fetchConversations = async (
  userId: string
): Promise<Conversation[]> => {
  try {
    const res = await fetch(`${API}/conversations?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return data.conversations ?? [];
  } catch {
    return [];
  }
};

/** Fetch all messages in a conversation */
export const fetchMessages = async (
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> => {
  try {
    const res = await fetch(
      `${API}/conversations/${conversationId}/messages?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    return data.messages ?? [];
  } catch {
    return [];
  }
};

/** Fetch online user IDs */
export const fetchOnlineUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API}/online-users`);
    const data = await res.json();
    return data.onlineUsers ?? [];
  } catch {
    return [];
  }
};
