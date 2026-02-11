import api from './axios';

// Submit feedback for an event
export const submitFeedback = async (eventId, feedbackData) => {
  const response = await api.post(`/feedback/event/${eventId}`, feedbackData);
  return response.data;
};

// Check if user has submitted feedback
export const checkFeedbackStatus = async (eventId) => {
  const response = await api.get(`/feedback/event/${eventId}/status`);
  return response.data;
};

// Update existing feedback
export const updateFeedback = async (eventId, feedbackData) => {
  const response = await api.put(`/feedback/event/${eventId}`, feedbackData);
  return response.data;
};

// Get feedback for an event (organizer only)
export const getEventFeedback = async (eventId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.rating) params.append('rating', filters.rating);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  
  const response = await api.get(`/feedback/event/${eventId}?${params.toString()}`);
  return response.data;
};

// Get feedback statistics (organizer only)
export const getFeedbackStats = async (eventId) => {
  const response = await api.get(`/feedback/event/${eventId}/stats`);
  return response.data;
};

// Export feedback data as CSV (organizer only)
export const exportFeedback = async (eventId) => {
  const response = await api.get(`/feedback/event/${eventId}/export`, {
    responseType: 'blob'
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `feedback-${eventId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { message: 'Feedback exported successfully' };
};
