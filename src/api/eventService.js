import api from './axios';

export const getAllEvents = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/events?${params}`);
    return response.data;
};

export const getEventById = async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
};

export const registerForEvent = async (eventId, formData = {}) => {
    const response = await api.post(`/events/${eventId}/register`, { formData });
    return response.data;
};

export const registerForMerchEvent = async (eventId, orderData) => {
    const response = await api.post(`/events/${eventId}/register-merch`, orderData);
    return response.data;
};

export const getTrendingEvents = async () => {
    const response = await api.get('/events/trending');
    return response.data;
};