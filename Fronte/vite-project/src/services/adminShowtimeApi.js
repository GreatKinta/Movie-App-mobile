import api from './api';

export const adminShowtimeApi = {
    getAdminShowtimes: (params) => api.get('/admin/showtimes', { params }),
    createShowtime: (data) => api.post('/admin/showtimes', data),
    updateShowtime: (id, data) => api.put(`/admin/showtimes/${id}`, data),
    cancelShowtime: (id) => api.delete(`/admin/showtimes/${id}`),
    autoGenerate: (data) => api.post('/admin/showtimes/auto-generate', data),
    publishShowtime: (id) => api.post(`/admin/showtimes/${id}/publish`),
};
