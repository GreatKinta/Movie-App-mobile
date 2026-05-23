import api from './api';

/** Quản lý Sơ Đồ Ghế — Admin Seat API */
export const adminSeatApi = {
    /** Lấy danh sách ghế theo RoomId */
    getSeatsByRoom: (roomId) => api.get(`/admin/seats/room/${roomId}`),

    /** Lấy danh sách loại ghế (SeatType) */
    getSeatTypes: () => api.get('/admin/seats/types'),

    /** Cập nhật loại ghế hàng loạt (sơ đồ ghế) */
    updateSeatMap: (roomId, payload) => api.put(`/admin/seats/room/${roomId}/map`, payload),

    /** Khởi tạo lưới sơ đồ ghế mới cho phòng trống */
    generateSeatMap: (roomId, payload) => api.post(`/admin/seats/room/${roomId}/generate`, payload),

    /** Xoá toàn bộ sơ đồ ghế của phòng */
    clearSeatMap: (roomId) => api.delete(`/admin/seats/room/${roomId}`),
};
