import api from './axios';
import { io } from 'socket.io-client';

let socket = null;

// Initialize socket connection
export const initSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });
  }
  return socket;
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  socket = null;
};

// Join event room for real-time updates
export const joinEventRoom = (eventId) => {
  const s = getSocket();
  s.emit('joinEventRoom', eventId);
};

// Leave event room
export const leaveEventRoom = (eventId) => {
  const s = getSocket();
  s.emit('leaveEventRoom', eventId);
};

// Get messages for an event
export const getMessages = async (eventId, params = {}) => {
  const response = await api.get(`/messages/event/${eventId}`, { params });
  return response.data;
};

// Post a new message
export const postMessage = async (eventId, content, parentId = null, isAnnouncement = false) => {
  const response = await api.post(`/messages/event/${eventId}`, {
    content,
    parentId,
    isAnnouncement,
  });
  return response.data;
};

// Edit a message
export const editMessage = async (messageId, content) => {
  const response = await api.patch(`/messages/${messageId}`, { content });
  return response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

// Toggle pin on a message
export const togglePinMessage = async (messageId) => {
  const response = await api.post(`/messages/${messageId}/pin`);
  return response.data;
};

// React to a message
export const reactToMessage = async (messageId, emoji) => {
  const response = await api.post(`/messages/${messageId}/react`, { emoji });
  return response.data;
};

// Get replies for a message
export const getReplies = async (messageId) => {
  const response = await api.get(`/messages/${messageId}/replies`);
  return response.data;
};

// Get unread message count
export const getUnreadCount = async (eventId, lastVisit) => {
  const params = lastVisit ? { lastVisit } : {};
  const response = await api.get(`/messages/event/${eventId}/unread`, { params });
  return response.data;
};
