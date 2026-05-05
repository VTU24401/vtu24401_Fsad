import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ChatBoxProps {
  roomId: string; // e.g., jobId or userId-conversationId
  currentUserId: string;
  currentUserName: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId, currentUserId, currentUserName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Join the chat room
    socket.emit('join-room', roomId);

    // Listen for messages
    socket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for chat history
    socket.on('chat-history', (history: Message[]) => {
      setMessages(history);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      // Handle typing indicator
      console.log(`${data.userName} is typing...`);
    });

    return () => {
      socket.off('receive-message');
      socket.off('chat-history');
      socket.off('user-typing');
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('send-message', {
        roomId,
        message: newMessage,
        senderId: currentUserId,
        senderName: currentUserName
      });
      setNewMessage('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    socket.emit('typing', {
      roomId,
      userName: currentUserName,
      isTyping: e.target.value.length > 0
    });
  };

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                msg.senderId === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm font-medium">{msg.senderName}</p>
              <p>{msg.message}</p>
              <p className="text-xs opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;