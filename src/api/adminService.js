import api from "./axios";

export const getPendingOrganizers = async () => {
    const response = await api.get('/admin/pending-organizers');
    return response.data;
};

export const approveOrganizer = async (id) => {
    const response = await api.put(`/admin/approve-organizer/${id}`);
    return response.data;
};

export const createOrganizer = async (organizerData) => {
    const response = await api.post('/admin/create-organizer', organizerData);
    return response.data;
};

export const rejectOrganizer = async (id) => {
    const response = await api.delete(`/admin/reject-organizer/${id}`);
    return response.data;
};

export const getAllOrganizers = async () => {
    const response = await api.get('/admin/organizers');
    return response.data;
};

export const removeOrganizer = async (id, permanent = false) => {
    const response = await api.delete(`/admin/organizers/${id}?permanent=${permanent}`);
    return response.data;
};

export const reactivateOrganizer = async (id) => {
    const response = await api.put(`/admin/organizers/${id}/reactivate`);
    return response.data;
};

export const resetOrganizerPassword = async (id, newPassword) => {
    const response = await api.post(`/admin/organizers/${id}/reset-password`, { newPassword });
    return response.data;
};

export const getStatistics = async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
};