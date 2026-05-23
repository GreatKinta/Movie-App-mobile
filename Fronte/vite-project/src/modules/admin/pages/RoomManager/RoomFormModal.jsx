import React, { useState, useEffect } from 'react';
import { X, Save, DoorOpen } from 'lucide-react';

const EMPTY_FORM = { name: '', status: 'active' };

const RoomFormModal = ({ mode, room, onSave, onClose }) => {
    const isEdit = mode === 'edit';
    const [form,    setForm]    = useState(EMPTY_FORM);
    const [saving,  setSaving]  = useState(false);
    const [errors,  setErrors]  = useState({});

    // Điền dữ liệu khi edit
    useEffect(() => {
        if (isEdit && room) {
            setForm({ name: room.name ?? '', status: room.status ?? 'active' });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [isEdit, room]);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Tên phòng không được để trống.';
        if (form.name.trim().length > 50) e.name = 'Tên phòng tối đa 50 ký tự.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setSaving(true);
        await onSave({ name: form.name.trim(), status: form.status }, isEdit, room?.id);
        setSaving(false);
    };

    return (
        <div className="rm-overlay" onClick={onClose}>
            <div className="rm-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="rm-modal-header">
                    <div className="rm-modal-title-wrap">
                        <DoorOpen size={20} className="rm-modal-icon" />
                        <h2 className="rm-modal-title">
                            {isEdit ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu mới'}
                        </h2>
                    </div>
                    <button className="rm-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form className="rm-modal-body" onSubmit={handleSubmit}>
                    {/* Tên phòng */}
                    <div className="rm-field">
                        <label className="rm-label">Tên phòng <span className="rm-required">*</span></label>
                        <input
                            className={`rm-input ${errors.name ? 'rm-input--error' : ''}`}
                            placeholder="Ví dụ: Phòng 1, Phòng IMAX..."
                            value={form.name}
                            onChange={e => {
                                setForm(f => ({ ...f, name: e.target.value }));
                                setErrors(er => ({ ...er, name: undefined }));
                            }}
                            maxLength={50}
                        />
                        {errors.name && <p className="rm-field-error">{errors.name}</p>}
                    </div>

                    {/* Trạng thái */}
                    <div className="rm-field">
                        <label className="rm-label">Trạng thái</label>
                        <select
                            className="rm-input rm-select"
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        >
                            <option value="active">Hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="rm-modal-footer">
                        <button type="button" className="rm-btn-ghost" onClick={onClose} disabled={saving}>
                            Huỷ
                        </button>
                        <button type="submit" className="rm-btn-primary" disabled={saving}>
                            <Save size={15} />
                            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm phòng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomFormModal;
