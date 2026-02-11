import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMessages,
  postMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  reactToMessage,
  getReplies,
  joinEventRoom,
  leaveEventRoom,
  getSocket,
} from '../api/messageService';
import Button from './Button';

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

// Single Message Component
const MessageItem = ({
  message,
  currentUserId,
  isOrganizer,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onLoadReplies,
  replies = [],
  repliesLoaded = false,
  depth = 0,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isAuthor = message.authorId?._id === currentUserId;
  const canModerate = isOrganizer;
  const canDelete = isAuthor || canModerate;

  const getAuthorName = () => {
    if (message.authorId?.role === 'organizer') {
      return message.authorId?.organizerProfile?.name || 'Organizer';
    }
    const profile = message.authorId?.participantProfile;
    if (profile?.firstname || profile?.lastname) {
      return `${profile.firstname || ''} ${profile.lastname || ''}`.trim();
    }
    return message.authorId?.email?.split('@')[0] || 'User';
  };

  const getReactionCounts = () => {
    const counts = {};
    message.reactions?.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  };

  const hasUserReacted = (emoji) => {
    return message.reactions?.some(r => r.userId === currentUserId && r.emoji === emoji);
  };

  const loadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      await onLoadReplies(message._id);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Auto-show replies when new ones arrive after initial load
  useEffect(() => {
    if (repliesLoaded && replies.length > 0) {
      setShowReplies(true);
    }
  }, [replies.length, repliesLoaded]);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await onEdit(message._id, editContent);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to edit message');
    }
  };

  const reactionCounts = getReactionCounts();

  return (
    <div
      className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} ${
        message.isPinned ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
      } ${message.isAnnouncement ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
    >
      <div className="py-3">
        {/* Message Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {getAuthorName().charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{getAuthorName()}</span>
                {message.authorId?.role === 'organizer' && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Organizer
                  </span>
                )}
                {message.isAnnouncement && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    📢 Announcement
                  </span>
                )}
                {message.isPinned && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    📌 Pinned
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
                {message.isEdited && <span className="ml-1">(edited)</span>}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-1">
            {canModerate && !message.isAnnouncement && (
              <button
                onClick={() => onPin(message._id)}
                className={`p-1 rounded hover:bg-gray-100 ${message.isPinned ? 'text-yellow-600' : 'text-gray-400'}`}
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 rounded hover:bg-gray-100"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(message._id)}
                className="p-1 text-gray-400 rounded hover:bg-gray-100 hover:text-red-500"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="mt-2 ml-10">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm" variant="success">
                  Save
                </Button>
                <Button onClick={() => { setIsEditing(false); setEditContent(message.content); }} size="sm" variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Reactions Display */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message._id, emoji)}
                  className={`px-2 py-0.5 rounded-full text-sm border ${
                    hasUserReacted(emoji)
                      ? 'bg-purple-100 border-purple-300'
                      : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                😀 React
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message._id, emoji);
                        setShowReactions(false);
                      }}
                      className="text-xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {depth === 0 && (
              <>
                <button
                  onClick={() => onReply(message)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  💬 Reply
                </button>
                {message.replyCount > 0 && (
                  <button
                    onClick={loadReplies}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    {showReplies ? '▼' : '▶'} {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3">
            {replies.map(reply => (
              <MessageItem
                key={reply._id}
                message={reply}
                currentUserId={currentUserId}
                isOrganizer={isOrganizer}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onReact={onReact}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Discussion Forum Component
const DiscussionForum = ({ eventId, isOrganizer = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posting, setPosting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [repliesByParent, setRepliesByParent] = useState({}); // { parentId: [replies] }
  const [loadedReplies, setLoadedReplies] = useState(new Set()); // Track which messages have loaded replies
  const messagesEndRef = useRef(null);

  // Load replies for a specific message
  const handleLoadReplies = useCallback(async (parentId) => {
    try {
      const data = await getReplies(parentId);
      setRepliesByParent(prev => ({
        ...prev,
        [parentId]: data.replies || []
      }));
      setLoadedReplies(prev => new Set([...prev, parentId]));
    } catch (error) {
      console.error('Error loading replies:', error);
      throw error;
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(eventId);
      setMessages(data.messages || []);
      setAnnouncements(data.announcements || []);
      setPinnedMessages(data.pinnedMessages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!eventId) return;

    // Join room
    joinEventRoom(eventId);
    const socket = getSocket();

    // Listen for new messages
    socket.on('newMessage', ({ message, parentId }) => {
      if (!parentId) {
        // Top-level message
        setMessages(prev => [message, ...prev]);
        if (message.isAnnouncement) {
          setAnnouncements(prev => [message, ...prev]);
        }
        if (message.authorId?._id !== user?.id) {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        // Reply - add to repliesByParent if we've loaded replies for this parent
        setRepliesByParent(prev => {
          if (prev[parentId]) {
            // Check if reply already exists
            const exists = prev[parentId].some(r => r._id === message._id);
            if (!exists) {
              return {
                ...prev,
                [parentId]: [...prev[parentId], message]
              };
            }
          }
          return prev;
        });
        
        // Update reply count on parent message
        setMessages(prev => prev.map(m => 
          m._id === parentId 
            ? { ...m, replyCount: (m.replyCount || 0) + 1 }
            : m
        ));
        setAnnouncements(prev => prev.map(m => 
          m._id === parentId 
            ? { ...m, replyCount: (m.replyCount || 0) + 1 }
            : m
        ));
        setPinnedMessages(prev => prev.map(m => 
          m._id === parentId 
            ? { ...m, replyCount: (m.replyCount || 0) + 1 }
            : m
        ));
      }
    });

    // Listen for edited messages
    socket.on('messageEdited', ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
      setAnnouncements(prev => prev.map(m => m._id === message._id ? message : m));
      setPinnedMessages(prev => prev.map(m => m._id === message._id ? message : m));
      // Also update in replies
      setRepliesByParent(prev => {
        const updated = { ...prev };
        for (const parentId in updated) {
          updated[parentId] = updated[parentId].map(r => 
            r._id === message._id ? message : r
          );
        }
        return updated;
      });
    });

    // Listen for deleted messages
    socket.on('messageDeleted', ({ messageId, parentId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setAnnouncements(prev => prev.filter(m => m._id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
      // Also remove from replies
      setRepliesByParent(prev => {
        const updated = { ...prev };
        for (const pId in updated) {
          updated[pId] = updated[pId].filter(r => r._id !== messageId);
        }
        return updated;
      });
      // Update reply count on parent if it was a reply
      if (parentId) {
        setMessages(prev => prev.map(m => 
          m._id === parentId 
            ? { ...m, replyCount: Math.max((m.replyCount || 1) - 1, 0) }
            : m
        ));
      }
    });

    // Listen for pin toggle
    socket.on('messagePinToggled', ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
      if (message.isPinned) {
        setPinnedMessages(prev => {
          if (!prev.find(m => m._id === message._id)) {
            return [message, ...prev];
          }
          return prev;
        });
      } else {
        setPinnedMessages(prev => prev.filter(m => m._id !== message._id));
      }
    });

    // Listen for reactions
    socket.on('messageReaction', ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
      setAnnouncements(prev => prev.map(m => m._id === message._id ? message : m));
      setPinnedMessages(prev => prev.map(m => m._id === message._id ? message : m));
      // Also update in replies
      setRepliesByParent(prev => {
        const updated = { ...prev };
        for (const parentId in updated) {
          updated[parentId] = updated[parentId].map(r => 
            r._id === message._id ? message : r
          );
        }
        return updated;
      });
    });

    // Cleanup
    return () => {
      leaveEventRoom(eventId);
      socket.off('newMessage');
      socket.off('messageEdited');
      socket.off('messageDeleted');
      socket.off('messagePinToggled');
      socket.off('messageReaction');
    };
  }, [eventId, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle post message
  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || posting) return;

    setPosting(true);
    try {
      await postMessage(
        eventId,
        newMessage.trim(),
        replyingTo?._id || null,
        isAnnouncement
      );
      setNewMessage('');
      setReplyingTo(null);
      setIsAnnouncement(false);
      // Real-time update will handle adding the message
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to post message');
    } finally {
      setPosting(false);
    }
  };

  // Handle edit
  const handleEdit = async (messageId, content) => {
    await editMessage(messageId, content);
  };

  // Handle delete
  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      alert('Failed to delete message');
    }
  };

  // Handle pin toggle
  const handlePin = async (messageId) => {
    try {
      await togglePinMessage(messageId);
    } catch (error) {
      alert('Failed to toggle pin');
    }
  };

  // Handle reaction
  const handleReact = async (messageId, emoji) => {
    try {
      await reactToMessage(messageId, emoji);
    } catch (error) {
      alert('Failed to react');
    }
  };

  // Clear unread when viewing
  useEffect(() => {
    if (messages.length > 0) {
      setUnreadCount(0);
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading discussion...</p>
      </div>
    );
  }

  // Filter out pinned and announcement messages from regular list to avoid duplication
  const regularMessages = messages.filter(
    m => !m.isPinned && !m.isAnnouncement
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">💬 Discussion Forum</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">{messages.length} messages</span>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-blue-50">
            <h4 className="text-sm font-semibold text-blue-800">📢 Announcements</h4>
          </div>
          <div className="divide-y">
            {announcements.map(msg => (
              <MessageItem
                key={msg._id}
                message={msg}
                currentUserId={user?.id}
                isOrganizer={isOrganizer}
                onReply={setReplyingTo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                onReact={handleReact}
                onLoadReplies={handleLoadReplies}
                replies={repliesByParent[msg._id] || []}
                repliesLoaded={loadedReplies.has(msg._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pinned Messages Section */}
      {pinnedMessages.filter(m => !m.isAnnouncement).length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-yellow-50">
            <h4 className="text-sm font-semibold text-yellow-800">📌 Pinned Messages</h4>
          </div>
          <div className="divide-y">
            {pinnedMessages.filter(m => !m.isAnnouncement).map(msg => (
              <MessageItem
                key={msg._id}
                message={msg}
                currentUserId={user?.id}
                isOrganizer={isOrganizer}
                onReply={setReplyingTo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                onReact={handleReact}
                onLoadReplies={handleLoadReplies}
                replies={repliesByParent[msg._id] || []}
                repliesLoaded={loadedReplies.has(msg._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Post New Message */}
      <div className="p-4 border-b bg-gray-50">
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Replying to: <span className="font-medium">{replyingTo.content.substring(0, 50)}...</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
        
        <form onSubmit={handlePostMessage}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Write a message..."}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
          
          <div className="mt-2 flex justify-between items-center">
            <div>
              {isOrganizer && !replyingTo && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">Post as Announcement</span>
                </label>
              )}
            </div>
            <Button
              type="submit"
              variant="purple"
              disabled={!newMessage.trim() || posting}
            >
              {posting ? 'Posting...' : replyingTo ? 'Reply' : 'Post Message'}
            </Button>
          </div>
        </form>
      </div>

      {/* Messages List */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {regularMessages.length === 0 && announcements.length === 0 && pinnedMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the discussion!</p>
          </div>
        ) : (
          regularMessages.map(msg => (
            <MessageItem
              key={msg._id}
              message={msg}
              currentUserId={user?.id}
              isOrganizer={isOrganizer}
              onReply={setReplyingTo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onReact={handleReact}
              onLoadReplies={handleLoadReplies}
              replies={repliesByParent[msg._id] || []}
              repliesLoaded={loadedReplies.has(msg._id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default DiscussionForum;
