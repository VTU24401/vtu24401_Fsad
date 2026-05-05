/**
 * ChatWindow.tsx
 * Right-side chat panel: message bubbles, input, typing indicator,
 * online badge, and auto-scroll.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Wifi, WifiOff, MoreVertical, CheckCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface ChatWindowProps {
  onBack?: () => void; // for mobile: go back to list
}

export default function ChatWindow({ onBack }: ChatWindowProps) {
  const { user, profile } = useAuth();
  const {
    conversations, activeConversationId,
    messages, onlineUsers, typingUsers,
    loadingMessages, sendMessage, emitTyping, closeConversation,
  } = useChat();

  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef          = useRef<HTMLDivElement>(null);
  const typingTimerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);

  // ── Determine other party ───────────────────
  const otherParty = (() => {
    if (!activeConv || !user) return null;
    if (activeConv.candidateId === user.id) {
      return { id: activeConv.employerId, name: activeConv.employerName };
    }
    return { id: activeConv.candidateId, name: activeConv.candidateName };
  })();

  const isOtherOnline = otherParty ? onlineUsers.includes(otherParty.id) : false;
  const isOtherTyping = otherParty ? !!typingUsers[otherParty.id] : false;

  // ── Auto-scroll ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // ── Focus input on conversation open ────────
  useEffect(() => {
    if (activeConversationId) inputRef.current?.focus();
  }, [activeConversationId]);

  // ── Typing handler ───────────────────────────
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      emitTyping(true);
    }

    // Stop typing after 1.5 s of no keystroke
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(false);
    }, 1500);

    if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
      emitTyping(false);
    }
  }, [isTyping, emitTyping]);

  // ── Send ─────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    setIsTyping(false);
    emitTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, sendMessage, emitTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Message read status icon ─────────────────
  const ReadIcon = ({ msg }: { msg: { readBy: string[]; senderId: string } }) => {
    if (!user || msg.senderId !== user.id) return null;
    const readByOther = otherParty && msg.readBy.includes(otherParty.id);
    return readByOther
      ? <CheckCheck className="w-3.5 h-3.5 text-blue-300 inline ml-1" />
      : <Check      className="w-3.5 h-3.5 text-blue-200 inline ml-1" />;
  };

  // ── Format time ──────────────────────────────
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDateDivider = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Date dividers between messages ───────────
  const isNewDay = (curr: string, prev: string | null) => {
    if (!prev) return true;
    return new Date(curr).toDateString() !== new Date(prev).toDateString();
  };

  // ── Empty state (no conversation selected) ───
  if (!activeConversationId || !activeConv) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-5">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
          <Send className="w-9 h-9 text-white rotate-[-45deg]" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Your Messages</h3>
          <p className="text-sm text-gray-500">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const initials = otherParty?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          {isOtherOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{otherParty?.name}</p>
          <p className="text-xs flex items-center gap-1">
            {isOtherOnline
              ? <><Wifi className="w-3 h-3 text-green-500" /><span className="text-green-600">Online</span></>
              : <><WifiOff className="w-3 h-3 text-gray-400" /><span className="text-gray-400">Offline</span></>
            }
          </p>
        </div>

        {/* Job tag */}
        <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
          <span className="text-xs font-medium text-blue-700 truncate max-w-[140px]">
            💼 {activeConv.jobTitle}
          </span>
        </div>

        <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* ── Messages area ──────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gradient-to-b from-gray-50 to-white">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-400 rotate-[-45deg]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Start the conversation</p>
              <p className="text-xs text-gray-400 mt-1">Say hello to {otherParty?.name}!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user?.id;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDate = isNewDay(msg.timestamp, prevMsg?.timestamp ?? null);
            const showAvatar = !isOwn && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <div key={msg.id}>
                {/* Date divider */}
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium px-2">
                      {formatDateDivider(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                {/* Message row */}
                <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
                  {/* Other party avatar */}
                  {!isOwn && (
                    <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </div>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`group max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-gray-400 ml-1 mb-1">{msg.senderName}</span>
                    )}
                    <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                      <ReadIcon msg={msg} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-end gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ──────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherParty?.name ?? ''}…`}
              className="w-full pl-4 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              autoComplete="off"
            />
          </div>
          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
