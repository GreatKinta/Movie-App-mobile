import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import './ShowtimeFormModal.css';

const ShowtimeFormModal = ({ showtime, movies, rooms, date, onSave, onClose }) => {
    const isEdit = !!showtime;
    const [form, setForm] = useState({
        movieId: '', roomId: '', startTime: '', basePrice: '', bufferTimeMinutes: 15,
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit && showtime) {
            const localTime = new Date(showtime.startTime).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            setForm({
                movieId: showtime.movieId,
                roomId: showtime.roomId,
                startTime: `${date}T${localTime}`,
                basePrice: showtime.basePrice,
                bufferTimeMinutes: 15,
            });
        } else {
            setForm({ movieId: '', roomId: '', startTime: `${date}T08:00`, basePrice: '', bufferTimeMinutes: 15 });
        }
    }, [isEdit, showtime, date]);

    const validate = () => {
        const e = {};
        if (!form.movieId)   e.movieId   = 'Vui lòng chọn phim.';
        if (!form.roomId)    e.roomId    = 'Vui lòng chọn phòng.';
        if (!form.startTime) e.startTime = 'Vui lòng chọn giờ bắt đầu.';
        if (!form.basePrice || +form.basePrice <= 0) e.basePrice = 'Giá vé phải lớn hơn 0.';
        if (form.startTime) {
            const h = new Date(form.startTime).getHours();
            if (h < 8 || h >= 24) e.startTime = 'Giờ chiếu phải từ 08:00 đến 24:00.';
        }
        return e;
    };

    const handleChange = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        await onSave(
            { ...form, movieId: +form.movieId, roomId: +form.roomId, basePrice: +form.basePrice },
            isEdit,
            showtime?.showtimeId
        );
        setSaving(false);
    };

    return (
        <div className="sfm-overlay" onClick={onClose}>
            <div className="sfm-modal" onClick={e => e.stopPropagation()}>
                <div className="sfm-header">
                    <div className="sfm-header-left">
                        <Clock size={18} className="sfm-icon" />
                        <h2>{isEdit ? 'Chỉnh Sửa Suất Chiếu' : 'Thêm Suất Chiếu'}</h2>
                    </div>
                    <button className="sfm-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form className="sfm-form" onSubmit={handleSubmit}>
                    <div className="sfm-grid">
                        <div className="sfm-field sfm-col-2">
                            <label>Phim <span className="sfm-req">*</span></label>
                            <select value={form.movieId} onChange={e => handleChange('movieId', e.target.value)} className={errors.movieId ? 'err' : ''}>
                                <option value="">-- Chọn phim --</option>
                                {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>)}
                            </select>
                            {errors.movieId && <span className="sfm-err">{errors.movieId}</span>}
                        </div>

                        <div className="sfm-field">
                            <label>Phòng chiếu <span className="sfm-req">*</span></label>
                            <select value={form.roomId} onChange={e => handleChange('roomId', e.target.value)} className={errors.roomId ? 'err' : ''}>
                                <option value="">-- Chọn phòng --</option>
                                {rooms.map(r => <option key={r.roomId} value={r.roomId}>{r.name}</option>)}
                            </select>
                            {errors.roomId && <span className="sfm-err">{errors.roomId}</span>}
                        </div>

                        <div className="sfm-field">
                            <label>Giờ bắt đầu <span className="sfm-req">*</span></label>
                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={e => handleChange('startTime', e.target.value)}
                                className={errors.startTime ? 'err' : ''}
                            />
                            {errors.startTime && <span className="sfm-err">{errors.startTime}</span>}
                        </div>

                        <div className="sfm-field">
                            <label>Giá vé (VND) <span className="sfm-req">*</span></label>
                            <input
                                type="number"
                                value={form.basePrice}
                                onChange={e => handleChange('basePrice', e.target.value)}
                                placeholder="75000"
                                min="0"
                                className={errors.basePrice ? 'err' : ''}
                            />
                            {errors.basePrice && <span className="sfm-err">{errors.basePrice}</span>}
                        </div>

                        <div className="sfm-field">
                            <label>Thời gian dọn dẹp (phút)</label>
                            <input
                                type="number"
                                value={form.bufferTimeMinutes}
                                onChange={e => handleChange('bufferTimeMinutes', +e.target.value)}
                                min="0" max="60"
                            />
                        </div>
                    </div>

                    <div className="sfm-footer">
                        <button type="button" className="sfm-btn-ghost" onClick={onClose}>Huỷ</button>
                        <button type="submit" className="sfm-btn-save" disabled={saving}>
                            <Save size={15} />
                            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm suất'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShowtimeFormModal;
