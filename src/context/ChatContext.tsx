/**
 * ChatContext.tsx
 * Global chat state: conversations list, active conversation,
 * messages, online users, typing indicators, and socket lifecycle.
 */
import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getSocket, disconnectSocket,
  fetchConversations, fetchMessages, startConversation,
  Conversation, ChatMessage, StartConversationParams,
} from '../lib/chatService';

// ─────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────
interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  onlineUsers: string[];
  typingUsers: Record<string, boolean>; // userId → isTyping
  totalUnread: number;
  loadingMessages: boolean;

  openConversation: (conversationId: string) => void;
  closeConversation: () => void;
  sendMessage: (text: string) => void;
  emitTyping: (isTyping: boolean) => void;
  startOrOpenConversation: (params: StartConversationParams) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  const [conversations, setConversations]         = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId]   = useState<string | null>(null);
  const [messages, setMessages]                   = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers]             = useState<string[]>([]);
  const [typingUsers, setTypingUsers]             = useState<Record<string, boolean>>({});
  const [loadingMessages, setLoadingMessages]     = useState(false);

  const socketRef     = useRef(getSocket());
  const activeConvRef = useRef<string | null>(null); // keep ref in sync for closures

  // ── Socket lifecycle ────────────────────────
  useEffect(() => {
    if (!user || !profile) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Identify this user to the server
    socket.emit('identify', {
      userId:   user.id,
      userName: profile.full_name || profile.email,
      userRole: profile.role,
    });

    // Incoming message
    socket.on('receive-message', (msg: ChatMessage) => {
      if (msg.conversationId === activeConvRef.current) {
        setMessages(prev => {
          // Deduplicate by id
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark read immediately if we're looking at this conversation
        socket.emit('mark-read', {
          conversationId: msg.conversationId,
          userId: user.id,
        });
      }
      // Always refresh conversation list to update unread / last message
      refreshConversations();
    });

    // Chat history on room join
    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
      setLoadingMessages(false);
    });

    // Online presence
    socket.on('online-users', (users: string[]) => {
      setOnlineUsers(users);
    });

    // Typing indicator
    socket.on('user-typing', ({ userId, isTyping }: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
    });

    // Server-pushed conversation updates
    socket.on('conversations-updated', (convs: Conversation[]) => {
      setConversations(convs);
    });

    // Read receipts
    socket.on('messages-read', ({ conversationId }: { conversationId: string; readBy: string }) => {
      if (conversationId === activeConvRef.current) {
        setMessages(prev =>
          prev.map(m => ({
            ...m,
            readBy: m.readBy.includes(user.id) ? m.readBy : [...m.readBy, user.id],
          }))
        );
      }
    });

    // Initial conversations load
    refreshConversations();

    return () => {
      socket.off('receive-message');
      socket.off('chat-history');
      socket.off('online-users');
      socket.off('user-typing');
      socket.off('conversations-updated');
      socket.off('messages-read');
    };
  }, [user?.id, profile?.role]);

  // ── Cleanup on logout ───────────────────────
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setActiveConvId(null);
      disconnectSocket();
    }
  }, [user]);

  // ── Helpers ─────────────────────────────────

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    const convs = await fetchConversations(user.id);
    setConversations(convs);
  }, [user?.id]);

  const openConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Leave previous room
    if (activeConvRef.current && activeConvRef.current !== conversationId) {
      socketRef.current.emit('leave-conversation', { conversationId: activeConvRef.current });
    }

    setActiveConvId(conversationId);
    activeConvRef.current = conversationId;
    setMessages([]);
    setLoadingMessages(true);
    setTypingUsers({});

    // Join new room via socket (server will push chat-history)
    socketRef.current.emit('join-conversation', {
      conversationId,
      userId: user.id,
    });

    // Fallback: also fetch via REST in case socket is slow
    const history = await fetchMessages(conversationId, user.id);
    if (history.length > 0) {
      setMessages(history);
      setLoadingMessages(false);
    }
  }, [user?.id]);

  const closeConversation = useCallback(() => {
    if (activeConvRef.current) {
      socketRef.current.emit('leave-conversation', { conversationId: activeConvRef.current });
    }
    setActiveConvId(null);
    activeConvRef.current = null;
    setMessages([]);
    setTypingUsers({});
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!user || !profile || !activeConvRef.current || !text.trim()) return;

    socketRef.current.emit('send-message', {
      conversationId: activeConvRef.current,
      senderId:   user.id,
      senderName: profile.full_name || profile.email,
      senderRole: profile.role,
      text: text.trim(),
    });
  }, [user?.id, profile?.full_name, profile?.role]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!user || !activeConvRef.current) return;
    socketRef.current.emit('typing', {
      conversationId: activeConvRef.current,
      userId:   user.id,
      userName: profile?.full_name || profile?.email || 'User',
      isTyping,
    });
  }, [user?.id, profile?.full_name]);

  const startOrOpenConversation = useCallback(async (params: StartConversationParams) => {
    const result = await startConversation(params);
    if (result.success && result.conversation) {
      await refreshConversations();
      await openConversation(result.conversation.id);
    }
  }, [refreshConversations, openConversation]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversationId, messages,
      onlineUsers, typingUsers, totalUnread, loadingMessages,
      openConversation, closeConversation, sendMessage, emitTyping,
      startOrOpenConversation, refreshConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
