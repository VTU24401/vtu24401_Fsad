/**
 * Chat.tsx
 * Full chat page — responsive split layout:
 *   Desktop: list (left) + window (right)
 *   Mobile:  list OR window, with back navigation
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { Conversation } from '../lib/chatService';
import { Lock } from 'lucide-react';

export default function Chat() {
  const { user, profile } = useAuth();
  const { navigate } = useApp();
  const { activeConversationId } = useChat();

  // Mobile: 'list' | 'window'
  const [mobileView, setMobileView] = useState<'list' | 'window'>('list');

  const handleSelectConversation = (_conv: Conversation) => {
    setMobileView('window');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in to view messages</h2>
          <p className="text-sm text-gray-500 mb-6">You need to be logged in to access the chat.</p>
          <button
            onClick={() => navigate('login')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
             style={{ height: 'calc(100vh - 120px)', minHeight: '560px' }}>

          {/* ── Desktop split layout ────────────────── */}
          <div className="hidden md:flex h-full">
            {/* Conversation list — fixed width */}
            <div className="w-80 flex-shrink-0 border-r border-gray-100 h-full overflow-hidden">
              <ChatList onSelectConversation={handleSelectConversation} />
            </div>
            {/* Chat window — fills remaining space */}
            <div className="flex-1 h-full overflow-hidden">
              <ChatWindow />
            </div>
          </div>

          {/* ── Mobile: conditional view ─────────────── */}
          <div className="md:hidden h-full">
            {mobileView === 'list' || !activeConversationId ? (
              <ChatList onSelectConversation={handleSelectConversation} />
            ) : (
              <ChatWindow onBack={handleBack} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
