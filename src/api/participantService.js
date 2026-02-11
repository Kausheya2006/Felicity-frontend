import api from './axios';

export const getMyRegistrations = async () => {
    const response = await api.get('/participant/registrations');
    return response.data;
};

export const cancelRegistration = async (registrationId) => {
    const response = await api.delete(`/participant/registrations/${registrationId}`);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/participant/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put('/participant/profile', profileData);
    return response.data;
};

export const changePassword = async (passwordData) => {
    const response = await api.put('/participant/change-password', passwordData);
    return response.data;
};

export const getAllOrganizers = async () => {
    const response = await api.get('/participant/organizers');
    return response.data;
};

export const getOrganizerById = async (organizerId) => {
    const response = await api.get(`/participant/organizers/${organizerId}`);
    return response.data;
};

export const getOrganizerEvents = async (organizerId) => {
    const response = await api.get(`/participant/organizers/${organizerId}/events`);
    return response.data;
};

export const followOrganizer = async (organizerId) => {
    const response = await api.post(`/participant/organizers/${organizerId}/follow`);
    return response.data;
};

export const unfollowOrganizer = async (organizerId) => {
    const response = await api.delete(`/participant/organizers/${organizerId}/follow`);
    return response.data;
};

export const getFollowedOrganizers = async () => {
    const response = await api.get('/participant/followed-organizers');
    return response.data;
};

export const uploadPaymentProof = async (registrationId, imageFile) => {
    const formData = new FormData();
    formData.append('paymentProof', imageFile);
    
    const response = await api.post(
        `/participant/registrations/${registrationId}/payment-proof`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return response.data;
};