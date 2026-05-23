import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import './AutoGenerateModal.css';

const AutoGenerateModal = ({ movies, rooms, date, onGenerate, onClose }) => {
    const [form, setForm] = useState({
        movieId: '', roomIds: [], date: date || new Date().toISOString().slice(0, 10), openTime: '08:00', closeTime: '23:00',
        basePrice: '', cleaningMinutes: 15,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const toggleRoom = (id) => {
        setForm(f => ({
            ...f,
            roomIds: f.roomIds.includes(id) ? f.roomIds.filter(r => r !== id) : [...f.roomIds, id],
        }));
    };

    const validate = () => {
        const e = {};
        if (!form.movieId)         e.movieId   = 'Vui lòng chọn phim.';
        if (!form.roomIds.length)  e.roomIds   = 'Chọn ít nhất 1 phòng.';
        if (!form.date)            e.date      = 'Vui lòng chọn ngày chiếu.';
        if (!form.basePrice || +form.basePrice <= 0) e.basePrice = 'Giá vé phải lớn hơn 0.';
        if (form.openTime >= form.closeTime) e.openTime = 'Giờ mở phải trước giờ đóng.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        await onGenerate({
            movieId: +form.movieId,
            roomIds: form.roomIds,
            date: form.date,
            openTime: form.openTime + ':00',
            closeTime: form.closeTime + ':00',
            basePrice: +form.basePrice,
            cleaningMinutes: +form.cleaningMinutes,
        });
        setLoading(false);
    };

    return (
        <div className="agm-overlay" onClick={onClose}>
            <div className="agm-modal" onClick={e => e.stopPropagation()}>
                <div className="agm-header">
                    <div className="agm-header-left">
                        <Zap size={18} className="agm-icon" />
                        <h2>Tạo Lịch Tự Động</h2>
                    </div>
                    <button className="agm-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form className="agm-form" onSubmit={handleSubmit}>
                    {/* Movie & Date Grid */}
                    <div className="agm-grid-2" style={{ marginBottom: '15px' }}>
                        {/* Movie */}
                        <div className="agm-field" style={{ margin: 0 }}>
                            <label>Phim <span className="agm-req">*</span></label>
                            <select value={form.movieId} onChange={e => setForm(f => ({ ...f, movieId: e.target.value }))} className={errors.movieId ? 'err' : ''}>
                                <option value="">-- Chọn phim --</option>
                                {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>)}
                            </select>
                            {errors.movieId && <span className="agm-err">{errors.movieId}</span>}
                        </div>

                        {/* Date */}
                        <div className="agm-field" style={{ margin: 0 }}>
                            <label>Ngày chiếu <span className="agm-req">*</span></label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={errors.date ? 'err' : ''} />
                            {errors.date && <span className="agm-err">{errors.date}</span>}
                        </div>
                    </div>

                    {/* Rooms */}
                    <div className="agm-field">
                        <label>Phòng chiếu <span className="agm-req">*</span></label>
                        <div className="agm-room-grid">
                            {rooms.map(r => (
                                <label key={r.roomId} className={`agm-room-check ${form.roomIds.includes(r.roomId) ? 'checked' : ''}`}>
                                    <input type="checkbox" checked={form.roomIds.includes(r.roomId)} onChange={() => toggleRoom(r.roomId)} />
                                    {r.name}
                                </label>
                            ))}
                        </div>
                        {errors.roomIds && <span className="agm-err">{errors.roomIds}</span>}
                    </div>

                    {/* Time range */}
                    <div className="agm-grid-2">
                        <div className="agm-field">
                            <label>Giờ mở cửa</label>
                            <input type="time" value={form.openTime} min="08:00" max="22:00"
                                onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))}
                                className={errors.openTime ? 'err' : ''} />
                            {errors.openTime && <span className="agm-err">{errors.openTime}</span>}
                        </div>
                        <div className="agm-field">
                            <label>Giờ đóng cửa</label>
                            <input type="time" value={form.closeTime} min="10:00" max="24:00"
                                onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} />
                        </div>
                        <div className="agm-field">
                            <label>Giá vé (VND) <span className="agm-req">*</span></label>
                            <input type="number" value={form.basePrice} placeholder="75000" min="0"
                                onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                                className={errors.basePrice ? 'err' : ''} />
                            {errors.basePrice && <span className="agm-err">{errors.basePrice}</span>}
                        </div>
                        <div className="agm-field">
                            <label>Thời gian dọn dẹp (phút)</label>
                            <input type="number" value={form.cleaningMinutes} min="0" max="60"
                                onChange={e => setForm(f => ({ ...f, cleaningMinutes: e.target.value }))} />
                        </div>
                    </div>

                    <div className="agm-info">
                        💡 Hệ thống sẽ tự động lấp đầy lịch chiếu từ <strong>{form.openTime}</strong> đến <strong>{form.closeTime}</strong>, cách nhau ít nhất <strong>{form.cleaningMinutes} phút</strong> dọn dẹp.
                    </div>

                    <div className="agm-footer">
                        <button type="button" className="agm-btn-ghost" onClick={onClose}>Huỷ</button>
                        <button type="submit" className="agm-btn-generate" disabled={loading}>
                            <Zap size={15} />
                            {loading ? 'Đang tạo...' : 'Tạo lịch tự động'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AutoGenerateModal;
