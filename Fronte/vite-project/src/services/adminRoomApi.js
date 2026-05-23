import api from './api';

/** Quản lý Phòng Chiếu — Admin Room API */
export const adminRoomApi = {
    /** Lấy danh sách phòng có phân trang */
    getRoomsPaged: (params) => api.get('/admin/rooms', { params }),

    /** Lấy toàn bộ phòng (không phân trang, dùng cho dropdown) */
    getAllRooms: () => api.get('/admin/rooms/all'),

    /** Lấy chi tiết một phòng */
    getRoomById: (id) => api.get(`/admin/rooms/${id}`),

    /** Tạo phòng mới */
    createRoom: (data) => api.post('/admin/rooms', data),

    /** Cập nhật thông tin phòng */
    updateRoom: (id, data) => api.put(`/admin/rooms/${id}`, data),

    /** Xóa phòng */
    deleteRoom: (id) => api.delete(`/admin/rooms/${id}`),
};
