import api from './axios';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

let socket = null;

// Initialize socket connection for team chat
export const initTeamChatSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getTeamChatSocket = () => socket;

export const disconnectTeamChatSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  socket = null;
};

// Join team chat room
export const joinTeamRoom = (teamId, userId) => {
  if (socket) {
    socket.emit('joinTeamRoom', { teamId, userId });
  }
};

// Leave team chat room
export const leaveTeamRoom = (teamId, userId) => {
  if (socket) {
    socket.emit('leaveTeamRoom', { teamId, userId });
  }
};

// Send typing indicator
export const sendTypingIndicator = (teamId, userId, isTyping) => {
  if (socket) {
    socket.emit('teamTyping', { teamId, userId, isTyping });
  }
};

// API calls
export const getTeamMessages = async (teamId, before = null, limit = 50) => {
  const params = { limit };
  if (before) params.before = before;
  
  const response = await api.get(`/team-messages/team/${teamId}`, { params });
  return response.data;
};

export const sendTeamMessage = async (teamId, content, messageType = 'TEXT', attachment = null, linkPreview = null) => {
  const response = await api.post(`/team-messages/team/${teamId}`, {
    content,
    messageType,
    attachment,
    linkPreview,
  });
  return response.data;
};

export const editTeamMessage = async (messageId, content) => {
  const response = await api.patch(`/team-messages/${messageId}`, { content });
  return response.data;
};

export const deleteTeamMessage = async (messageId) => {
  const response = await api.delete(`/team-messages/${messageId}`);
  return response.data;
};

export const markTeamMessagesAsRead = async (teamId) => {
  const response = await api.post(`/team-messages/team/${teamId}/read`);
  return response.data;
};

export const getTeamUnreadCount = async (teamId) => {
  const response = await api.get(`/team-messages/team/${teamId}/unread`);
  return response.data;
};
