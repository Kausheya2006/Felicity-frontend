import api from './axios';

export const createEvent = async (eventData) => {
    const response = await api.post('/organizer/events', eventData);
    return response.data;
};

export const getMyEvents = async () => {
    const response = await api.get('/organizer/events');
    return response.data;
};

export const editEvent = async (eventId, updates) => {
    const response = await api.patch(`/organizer/events/${eventId}`, updates);
    return response.data;
};

export const publishEvent = async (eventId) => {
    const response = await api.post(`/organizer/events/${eventId}/publish`);
    return response.data;
};

export const changeEventStatus = async (eventId, status) => {
    const response = await api.patch(`/organizer/events/${eventId}/status`, { status });
    return response.data;
};

export const editPublishedEvent = async (eventId, updates) => {
    const response = await api.patch(`/organizer/events/${eventId}/published-edit`, updates);
    return response.data;
};

export const getEventRegistrations = async (eventId) => {
    const response = await api.get(`/organizer/events/${eventId}/registrations`);
    return response.data;
};

export const checkInParticipant = async (eventId, qrPayload) => {
    const response = await api.post(`/organizer/events/${eventId}/checkin`, { qrPayload });
    return response.data;
};

export const getEventAnalytics = async (eventId) => {
    const response = await api.get(`/organizer/events/${eventId}/analytics`);
    return response.data;
};

export const exportRegistrations = async (eventId) => {
    const response = await api.get(`/organizer/events/${eventId}/export`);
    return response.data;
};

export const getAttendanceList = async (eventId) => {
    const response = await api.get(`/organizer/events/${eventId}/attendance`);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/user/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.patch('/user/profile', profileData);
    return response.data;
};

// Payment approval functions
export const getPaymentApprovals = async (eventId, status = null) => {
    const params = status ? { status } : {};
    const response = await api.get(`/organizer/events/${eventId}/payment-approvals`, { params });
    return response.data;
};

export const approvePayment = async (registrationId) => {
    const response = await api.post(`/organizer/registrations/${registrationId}/approve-payment`);
    return response.data;
};

export const rejectPayment = async (registrationId, reason) => {
    const response = await api.post(`/organizer/registrations/${registrationId}/reject-payment`, { reason });
    return response.data;
};