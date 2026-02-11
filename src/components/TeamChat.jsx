import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeamMessages,
  sendTeamMessage,
  editTeamMessage,
  deleteTeamMessage,
  markTeamMessagesAsRead,
  initTeamChatSocket,
  getTeamChatSocket,
  joinTeamRoom,
  leaveTeamRoom,
  sendTypingIndicator,
} from '../api/teamChatService';
import Button from './Button';

// URL regex for link detection
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Single Message Component
const ChatMessage = ({
  message,
  currentUserId,
  onEdit,
  onDelete,
  teamMembers,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isAuthor = message.authorId?._id === currentUserId;

  const getAuthorName = () => {
    const profile = message.authorId?.participantProfile;
    if (profile?.firstname || profile?.lastname) {
      return `${profile.firstname || ''} ${profile.lastname || ''}`.trim();
    }
    return message.authorId?.email?.split('@')[0] || 'User';
  };

  const isOnline = (userId) => {
    return teamMembers?.onlineUsers?.includes(userId);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await onEdit(message._id, editContent);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to edit message');
    }
  };

  // Parse content for links
  const renderContent = (content) => {
    const parts = content.split(URL_REGEX);
    return parts.map((part, i) => {
      if (part.match(URL_REGEX)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isAuthor ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${isAuthor ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-end gap-2 ${isAuthor ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
              isAuthor ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              {getAuthorName().charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            {isOnline(message.authorId?._id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          {/* Message bubble */}
          <div className={`rounded-2xl px-4 py-2 ${
            isAuthor
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}>
            {/* Name for others' messages */}
            {!isAuthor && (
              <p className="text-xs font-semibold text-purple-600 mb-1">
                {getAuthorName()}
              </p>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 text-gray-800 bg-white border border-gray-300 rounded text-sm"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {renderContent(message.content)}
              </p>
            )}

            {/* Attachment */}
            {message.attachment?.fileName && (
              <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                <a
                  href={message.attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm"
                >
                  📎 {message.attachment.fileName}
                </a>
              </div>
            )}

            {/* Time and status */}
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              isAuthor ? 'text-blue-100' : 'text-gray-400'
            }`}>
              <span>{formatTime(message.createdAt)}</span>
              {message.isEdited && <span>(edited)</span>}
            </div>
          </div>
        </div>

        {/* Actions for own messages */}
        {isAuthor && !isEditing && (
          <div className="flex justify-end gap-2 mt-1 pr-10">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(message._id)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main TeamChat Component
const TeamChat = ({ team, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket and fetch messages
  useEffect(() => {
    if (!team?._id || !user) return;

    const token = localStorage.getItem('token');
    initTeamChatSocket(token);
    joinTeamRoom(team._id, user.id);

    const socket = getTeamChatSocket();

    // Listen for new messages
    socket.on('newTeamMessage', ({ message }) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Listen for edited messages
    socket.on('teamMessageEdited', ({ message }) => {
      setMessages(prev => prev.map(m => (m._id === message._id ? message : m)));
    });

    // Listen for deleted messages
    socket.on('teamMessageDeleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    // Listen for online users
    socket.on('teamOnlineUsers', ({ onlineUsers: users }) => {
      setOnlineUsers(users);
    });

    // Listen for typing users
    socket.on('teamTypingUsers', ({ typingUsers: users }) => {
      setTypingUsers(users.filter(id => id !== user.id));
    });

    // Fetch messages
    fetchMessages();
    
    // Mark messages as read
    markTeamMessagesAsRead(team._id).catch(console.error);

    return () => {
      leaveTeamRoom(team._id, user.id);
      socket.off('newTeamMessage');
      socket.off('teamMessageEdited');
      socket.off('teamMessageDeleted');
      socket.off('teamOnlineUsers');
      socket.off('teamTypingUsers');
    };
  }, [team?._id, user]);

  const fetchMessages = async (before = null) => {
    try {
      const data = await getTeamMessages(team._id, before);
      if (before) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.messages.length === 50);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading]);

  // Handle typing indicator
  const handleTyping = () => {
    sendTypingIndicator(team._id, user.id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(team._id, user.id, false);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendTeamMessage(team._id, newMessage.trim());
      setNewMessage('');
      sendTypingIndicator(team._id, user.id, false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId, content) => {
    await editTeamMessage(messageId, content);
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteTeamMessage(messageId);
    } catch (error) {
      alert('Failed to delete message');
    }
  };

  // Load more messages
  const handleLoadMore = () => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].createdAt);
    }
  };

  // Get member name by ID
  const getMemberName = (userId) => {
    // Check if team leader
    if (team.teamLeader?._id === userId || team.teamLeader === userId) {
      const leader = team.teamLeader;
      if (leader?.participantProfile) {
        return `${leader.participantProfile.firstname || ''} ${leader.participantProfile.lastname || ''}`.trim();
      }
    }
    
    // Check members
    const member = team.members?.find(m => m.userId?._id === userId || m.userId === userId);
    if (member?.userId?.participantProfile) {
      const profile = member.userId.participantProfile;
      return `${profile.firstname || ''} ${profile.lastname || ''}`.trim();
    }
    
    return 'Someone';
  };

  // Get typing text
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      return `${getMemberName(typingUsers[0])} is typing...`;
    }
    if (typingUsers.length === 2) {
      return `${getMemberName(typingUsers[0])} and ${getMemberName(typingUsers[1])} are typing...`;
    }
    return 'Several people are typing...';
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{team.teamName}</h3>
            <p className="text-sm text-purple-200">
              {onlineUsers.length} online · {team.members?.filter(m => m.status === 'ACCEPTED').length + 1} members
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Online Members Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-gray-500 flex-shrink-0">Online:</span>
        {onlineUsers.length > 0 ? (
          onlineUsers.map(userId => (
            <span
              key={userId}
              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {getMemberName(userId)}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No one else online</span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ minHeight: 0 }}
      >
        {/* Load More */}
        {hasMore && messages.length > 0 && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-2"></span>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg._id}
              message={msg}
              currentUserId={user.id}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              teamMembers={{ onlineUsers }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {getTypingText()}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending}
          />
          <Button
            type="submit"
            variant="purple"
            disabled={!newMessage.trim() || sending}
            className="rounded-full px-6"
          >
            {sending ? '...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TeamChat;
