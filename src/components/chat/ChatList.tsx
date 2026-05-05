/**
 * ChatList.tsx
 * Left-side inbox: all conversations for the logged-in user.
 */
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Conversation } from '../../lib/chatService';
import { MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface ChatListProps {
  onSelectConversation?: (conv: Conversation) => void;
}

export default function ChatList({ onSelectConversation }: ChatListProps) {
  const { user } = useAuth();
  const { conversations, activeConversationId, onlineUsers, openConversation } = useChat();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (
      c.jobTitle.toLowerCase().includes(q) ||
      c.candidateName.toLowerCase().includes(q) ||
      c.employerName.toLowerCase().includes(q) ||
      (c.lastMessage ?? '').toLowerCase().includes(q)
    );
  });

  const handleSelect = (conv: Conversation) => {
    openConversation(conv.id);
    onSelectConversation?.(conv);
  };

  const getOtherParty = (conv: Conversation) => {
    if (!user) return { name: '—', id: '' };
    if (conv.candidateId === user.id) return { name: conv.employerName, id: conv.employerId };
    return { name: conv.candidateName, id: conv.candidateId };
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24)    return `${diffH}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0) > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}
            </span>
          )}
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {search ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            {!search && (
              <p className="text-xs text-gray-400 leading-relaxed">
                Apply for a job and start a chat with the employer to see your conversations here.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map(conv => {
              const other = getOtherParty(conv);
              const isOnline = onlineUsers.includes(other.id);
              const isActive = conv.id === activeConversationId;
              const initials = other.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

              return (
                <li key={conv.id}>
                  <button
                    onClick={() => handleSelect(conv)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      }`}>
                        {initials}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                          {other.name}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(conv.lastMessageAt || conv.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        💼 {conv.jobTitle}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                          {conv.lastMessage ?? 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
