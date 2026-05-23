import api from './api';

export const adminTicketApi = {
    bookAtCounter: (data) => api.post('/admin/bookings', data),
    scanTicket: (data) => api.post('/admin/tickets/scan', data),
};
