import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Zap, AlertTriangle, Save, Filter } from 'lucide-react';
import { adminShowtimeApi } from '../../../../services/adminShowtimeApi';
import { adminMovieApi } from '../../../../services/adminMovieApi';
import api from '../../../../services/api';
import ShowtimeTimelineGrid from './ShowtimeTimelineGrid';
import ShowtimeFormModal from './ShowtimeFormModal';
import AutoGenerateModal from './AutoGenerateModal';
import './ShowtimeManager.css';

const today = () => new Date().toISOString().slice(0, 10);

const ShowtimeManager = () => {
    const [showtimes, setShowtimes] = useState([]);
    const [movies,    setMovies]    = useState([]);
    const [rooms,     setRooms]     = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [toast,     setToast]     = useState(null);

    const [date,   setDate]   = useState(today());
    const [roomId, setRoomId] = useState('');

    const [formModal,     setFormModal]     = useState({ open: false, showtime: null });
    const [autoModal,     setAutoModal]     = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch rooms & movies once ─────────────────────────────────────
    useEffect(() => {
        api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
        adminMovieApi.getMoviesPaged({ pageSize: 200 }).then(r => setMovies(r.data.items)).catch(() => {});
    }, []);

    // ── Fetch showtimes ───────────────────────────────────────────────
    const fetchShowtimes = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date };
            if (roomId) params.roomId = roomId;
            const res = await adminShowtimeApi.getAdminShowtimes(params);
            setShowtimes(res.data);
        } catch {
            showToast('Không thể tải suất chiếu.', 'error');
        } finally {
            setLoading(false);
        }
    }, [date, roomId]);

    useEffect(() => { fetchShowtimes(); }, [fetchShowtimes]);

    // ── Handlers ──────────────────────────────────────────────────────
    const handleSaveShowtime = async (formData, isEdit, id) => {
        try {
            if (isEdit) {
                await adminShowtimeApi.updateShowtime(id, formData);
                showToast('Cập nhật suất chiếu thành công!');
            } else {
                await adminShowtimeApi.createShowtime(formData);
                showToast('Thêm suất chiếu thành công!');
            }
            setFormModal({ open: false });
            fetchShowtimes();
        } catch (e) {
            const msg = e.response?.data?.message || 'Lỗi không xác định.';
            showToast(msg, 'error');
        }
    };

    const handleCancelShowtime = async (id) => {
        try {
            await adminShowtimeApi.cancelShowtime(id);
            showToast('Đã hủy suất chiếu.');
            setConfirmCancel(null);
            fetchShowtimes();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể hủy suất chiếu.';
            showToast(msg, 'error');
            setConfirmCancel(null);
        }
    };

    const handleAutoGenerate = async (formData) => {
        try {
            const res = await adminShowtimeApi.autoGenerate(formData);
            showToast(res.data.message || 'Auto-generate thành công!');
            setAutoModal(false);
            fetchShowtimes();
        } catch (e) {
            const msg = e.response?.data?.message || 'Auto-generate thất bại.';
            showToast(msg, 'error');
        }
    };

    const handlePublishShowtime = async (id) => {
        try {
            await adminShowtimeApi.publishShowtime(id);
            showToast('Đã xuất bản suất chiếu lên web!');
            fetchShowtimes();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể xuất bản suất chiếu.';
            showToast(msg, 'error');
        }
    };

    return (
        <div className="sm-page">
            {/* ── Toast ── */}
            {toast && (
                <div className={`sm-toast sm-toast--${toast.type}`}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <Save size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="sm-header">
                <div className="sm-header-left">
                    <CalendarDays size={22} className="sm-header-icon" />
                    <div>
                        <h1 className="sm-title">Lịch Chiếu</h1>
                        <p className="sm-subtitle">{showtimes.length} suất chiếu hôm nay</p>
                    </div>
                </div>
                <div className="sm-header-actions">
                    <button className="sm-btn-auto" onClick={() => setAutoModal(true)}>
                        <Zap size={15} /> Tạo tự động
                    </button>
                    <button className="sm-btn-primary" onClick={() => setFormModal({ open: true, showtime: null })}>
                        <Plus size={15} /> Thêm suất chiếu
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="sm-filters">
                <Filter size={15} className="sm-filter-icon" />
                <input
                    type="date"
                    className="sm-date-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
                <select
                    className="sm-select"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                >
                    <option value="">Tất cả phòng</option>
                    {rooms.map(r => (
                        <option key={r.roomId} value={r.roomId}>{r.name}</option>
                    ))}
                </select>
            </div>

            {/* ── Timeline Grid ── */}
            {loading ? (
                <div className="sm-loading">Đang tải lịch chiếu...</div>
            ) : (
                <ShowtimeTimelineGrid
                    showtimes={showtimes}
                    rooms={rooms.filter(r => !roomId || r.roomId === +roomId)}
                    onClickShowtime={st => setFormModal({ open: true, showtime: st })}
                    onCancelShowtime={st => setConfirmCancel(st)}
                    onPublishShowtime={handlePublishShowtime}
                />
            )}

            {/* ── Form Modal ── */}
            {formModal.open && (
                <ShowtimeFormModal
                    showtime={formModal.showtime}
                    movies={movies}
                    rooms={rooms}
                    date={date}
                    onSave={handleSaveShowtime}
                    onClose={() => setFormModal({ open: false })}
                />
            )}

            {/* ── Auto Generate Modal ── */}
            {autoModal && (
                <AutoGenerateModal
                    movies={movies}
                    rooms={rooms}
                    date={date}
                    onGenerate={handleAutoGenerate}
                    onClose={() => setAutoModal(false)}
                />
            )}

            {/* ── Confirm Cancel ── */}
            {confirmCancel && (
                <div className="sm-overlay" onClick={() => setConfirmCancel(null)}>
                    <div className="sm-confirm" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={32} className="sm-confirm-icon" />
                        <h3>Xác nhận hủy suất chiếu</h3>
                        <p>
                            Hủy suất <strong>{confirmCancel.movieTitle}</strong> lúc{' '}
                            <strong>{new Date(confirmCancel.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>?
                            <br />
                            <span className="sm-confirm-warn">Toàn bộ ghế đang giữ sẽ bị giải phóng.</span>
                        </p>
                        <div className="sm-confirm-actions">
                            <button className="sm-btn-ghost" onClick={() => setConfirmCancel(null)}>Thôi</button>
                            <button className="sm-btn-danger" onClick={() => handleCancelShowtime(confirmCancel.showtimeId)}>
                                Hủy suất chiếu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShowtimeManager;
