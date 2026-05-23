import React, { useState, useEffect, useCallback } from 'react';
import {
    DoorOpen, Plus, Search, Edit2, Trash2,
    ChevronLeft, ChevronRight, X, Save,
    AlertTriangle, LayoutGrid,
} from 'lucide-react';
import { adminRoomApi } from '../../../../services/adminRoomApi';
import RoomFormModal from './RoomFormModal';
import './RoomManager.css';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
    active:      { label: 'Hoạt động',   cls: 'rm-badge--active' },
    maintenance: { label: 'Bảo trì',      cls: 'rm-badge--maintenance' },
};

const RoomManager = () => {
    const navigate = useNavigate();

    const [data,    setData]    = useState({ items: [], totalCount: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const [params, setParams]           = useState({ pageNumber: 1, pageSize: 10, search: '' });
    const [searchInput, setSearchInput] = useState('');

    const [modal,         setModal]         = useState({ open: false, mode: 'create', room: null });
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast,         setToast]         = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminRoomApi.getRoomsPaged(params);
            setData(res.data);
        } catch {
            setError('Không thể tải danh sách phòng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    // ── Search debounce ────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(
            () => setParams(p => ({ ...p, search: searchInput, pageNumber: 1 })),
            400
        );
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Toast helper ───────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── CRUD handlers ──────────────────────────────────────────────────────
    const handleSave = async (formData, isEdit, id) => {
        try {
            if (isEdit) {
                await adminRoomApi.updateRoom(id, formData);
                showToast('Cập nhật phòng chiếu thành công!');
            } else {
                await adminRoomApi.createRoom(formData);
                showToast('Thêm phòng chiếu thành công!');
            }
            setModal({ open: false });
            fetchRooms();
        } catch (e) {
            showToast(e.response?.data?.message || 'Lỗi không xác định.', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminRoomApi.deleteRoom(id);
            showToast('Đã xoá phòng chiếu thành công!');
            setConfirmDelete(null);
            fetchRooms();
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể xoá phòng này.', 'error');
            setConfirmDelete(null);
        }
    };

    return (
        <div className="rm-page">
            {/* ── Toast ── */}
            {toast && (
                <div className={`rm-toast rm-toast--${toast.type}`}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <Save size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="rm-header">
                <div className="rm-header-left">
                    <DoorOpen size={22} className="rm-header-icon" />
                    <div>
                        <h1 className="rm-title">Quản Lý Phòng Chiếu</h1>
                        <p className="rm-subtitle">{data.totalCount} phòng trong hệ thống</p>
                    </div>
                </div>
                <button
                    className="rm-btn-primary"
                    onClick={() => setModal({ open: true, mode: 'create', room: null })}
                >
                    <Plus size={16} /> Thêm Phòng
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="rm-filters">
                <div className="rm-search-wrap">
                    <Search size={15} className="rm-search-icon" />
                    <input
                        className="rm-search"
                        placeholder="Tìm kiếm tên phòng..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button className="rm-search-clear" onClick={() => setSearchInput('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="rm-table-wrap">
                {loading && <div className="rm-loading">Đang tải...</div>}
                {error   && <div className="rm-error">{error}</div>}
                {!loading && !error && (
                    <table className="rm-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên Phòng</th>
                                <th>Tổng số ghế</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="rm-empty">Không có phòng nào.</td>
                                </tr>
                            ) : data.items.map(room => (
                                <tr key={room.id} className="rm-row">
                                    <td>
                                        <span className="rm-id">#{room.id}</span>
                                    </td>
                                    <td>
                                        <div className="rm-room-name">{room.name}</div>
                                    </td>
                                    <td>
                                        <span className="rm-seat-count">
                                            {room.totalSeats ?? 0} ghế
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`rm-badge ${STATUS_LABELS[room.status]?.cls || ''}`}>
                                            {STATUS_LABELS[room.status]?.label || room.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="rm-actions">
                                            <button
                                                className="rm-btn-icon rm-btn-map"
                                                title="Sơ đồ ghế"
                                                onClick={() => navigate(`/admin/rooms/${room.id}/seats`)}
                                            >
                                                <LayoutGrid size={15} />
                                            </button>
                                            <button
                                                className="rm-btn-icon rm-btn-edit"
                                                title="Chỉnh sửa"
                                                onClick={() => setModal({ open: true, mode: 'edit', room })}
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                className="rm-btn-icon rm-btn-del"
                                                title="Xoá"
                                                onClick={() => setConfirmDelete(room)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination ── */}
            <div className="rm-pagination">
                <span className="rm-page-info">
                    Trang {params.pageNumber} / {data.totalPages}
                </span>
                <div className="rm-page-btns">
                    <button
                        className="rm-page-btn"
                        disabled={params.pageNumber <= 1}
                        onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber - 1 }))}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(pg => (
                        <button
                            key={pg}
                            className={`rm-page-btn ${pg === params.pageNumber ? 'active' : ''}`}
                            onClick={() => setParams(p => ({ ...p, pageNumber: pg }))}
                        >
                            {pg}
                        </button>
                    ))}
                    <button
                        className="rm-page-btn"
                        disabled={params.pageNumber >= data.totalPages}
                        onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber + 1 }))}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <select
                    className="rm-select-sm"
                    value={params.pageSize}
                    onChange={e => setParams(p => ({ ...p, pageSize: Number(e.target.value), pageNumber: 1 }))}
                >
                    {[5, 10, 20].map(n => <option key={n} value={n}>{n} / trang</option>)}
                </select>
            </div>

            {/* ── Form Modal ── */}
            {modal.open && (
                <RoomFormModal
                    mode={modal.mode}
                    room={modal.room}
                    onSave={handleSave}
                    onClose={() => setModal({ open: false })}
                />
            )}

            {/* ── Confirm Delete ── */}
            {confirmDelete && (
                <div className="rm-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="rm-confirm" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={32} className="rm-confirm-icon" />
                        <h3>Xác nhận xoá phòng</h3>
                        <p>
                            Bạn có chắc muốn xoá phòng <strong>"{confirmDelete.name}"</strong>?<br />
                            Toàn bộ ghế trong phòng cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                        </p>
                        <div className="rm-confirm-actions">
                            <button className="rm-btn-ghost" onClick={() => setConfirmDelete(null)}>Huỷ</button>
                            <button className="rm-btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Xoá phòng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManager;
