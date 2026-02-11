import api from './axios';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

let socket = null;

// Initialize socket connection
export const initNotificationSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getNotificationSocket = () => socket;

export const disconnectNotificationSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  socket = null;
};

// Join user's notification room
export const joinUserRoom = (userId) => {
  if (socket) {
    socket.emit('joinUserRoom', userId);
  }
};

// Leave user room
export const leaveUserRoom = (userId) => {
  if (socket) {
    socket.emit('leaveUserRoom', userId);
  }
};

// API calls
export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const response = await api.get('/notifications', {
    params: { page, limit, unreadOnly },
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};
