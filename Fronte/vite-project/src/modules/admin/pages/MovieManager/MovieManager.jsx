import React, { useState, useEffect, useCallback } from 'react';
import { Film, Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save, AlertTriangle } from 'lucide-react';
import { adminMovieApi } from '../../../../services/adminMovieApi';
import MovieFormModal from './MovieFormModal';
import './MovieManager.css';

const STATUS_LABELS = {
    draft:   { label: 'Bản nháp',   cls: 'badge-draft' },
    showing: { label: 'Đang chiếu', cls: 'badge-showing' },
    coming:  { label: 'Sắp chiếu',  cls: 'badge-coming'  },
};

const MovieManager = () => {
    const [data,    setData]    = useState({ items: [], totalCount: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const [params, setParams] = useState({ pageNumber: 1, pageSize: 10, search: '', status: '' });
    const [searchInput, setSearchInput] = useState('');

    const [modal, setModal] = useState({ open: false, mode: 'create', movie: null });
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────
    const fetchMovies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminMovieApi.getMoviesPaged(params);
            setData(res.data);
        } catch (e) {
            setError('Không thể tải danh sách phim.');
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { fetchMovies(); }, [fetchMovies]);

    // ── Toast helper ───────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Search debounce ────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setParams(p => ({ ...p, search: searchInput, pageNumber: 1 })), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── CRUD handlers ──────────────────────────────────────────────────
    const handleSave = async (formData, isEdit, id) => {
        try {
            if (isEdit) {
                await adminMovieApi.updateMovie(id, formData);
                showToast('Cập nhật phim thành công!');
            } else {
                await adminMovieApi.createMovie(formData);
                showToast('Thêm phim thành công!');
            }
            setModal({ open: false });
            fetchMovies();
        } catch (e) {
            const msg = e.response?.data?.message || 'Lỗi không xác định.';
            showToast(msg, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminMovieApi.deleteMovie(id);
            showToast('Đã xoá phim thành công!');
            setConfirmDelete(null);
            fetchMovies();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể xoá phim này.';
            showToast(msg, 'error');
            setConfirmDelete(null);
        }
    };

    const handlePublish = async (id) => {
        try {
            // Tạm thời chọn trạng thái showing là mặc định khi xuất bản
            await adminMovieApi.publishMovie(id, 'showing');
            showToast('Đã xuất bản phim lên web!');
            fetchMovies();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể xuất bản phim này.';
            showToast(msg, 'error');
        }
    };

    return (
        <div className="mm-page">
            {/* ── Toast ── */}
            {toast && (
                <div className={`mm-toast mm-toast--${toast.type}`}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <Save size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="mm-header">
                <div className="mm-header-left">
                    <Film size={22} className="mm-header-icon" />
                    <div>
                        <h1 className="mm-title">Quản Lý Phim</h1>
                        <p className="mm-subtitle">{data.totalCount} phim trong hệ thống</p>
                    </div>
                </div>
                <button className="mm-btn-primary" onClick={() => setModal({ open: true, mode: 'create', movie: null })}>
                    <Plus size={16} /> Thêm Phim
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="mm-filters">
                <div className="mm-search-wrap">
                    <Search size={15} className="mm-search-icon" />
                    <input
                        className="mm-search"
                        placeholder="Tìm kiếm tên phim..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button className="mm-search-clear" onClick={() => setSearchInput('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    className="mm-select"
                    value={params.status}
                    onChange={e => setParams(p => ({ ...p, status: e.target.value, pageNumber: 1 }))}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="draft">Bản nháp</option>
                    <option value="showing">Đang chiếu</option>
                    <option value="coming">Sắp chiếu</option>
                </select>
            </div>

            {/* ── Table ── */}
            <div className="mm-table-wrap">
                {loading && <div className="mm-loading">Đang tải...</div>}
                {error   && <div className="mm-error">{error}</div>}
                {!loading && !error && (
                    <table className="mm-table">
                        <thead>
                            <tr>
                                <th>Poster</th>
                                <th>Tên phim</th>
                                <th>Thể loại</th>
                                <th>Thời lượng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="mm-empty">Không có phim nào.</td>
                                </tr>
                            ) : data.items.map(m => (
                                <tr key={m.id} className="mm-row">
                                    <td>
                                        {m.poster
                                            ? <img src={m.poster} alt={m.title} className="mm-poster" />
                                            : <div className="mm-poster-placeholder"><Film size={20} /></div>
                                        }
                                    </td>
                                    <td>
                                        <div className="mm-movie-title">{m.title}</div>
                                        <div className="mm-movie-director">{m.director || '—'}</div>
                                    </td>
                                    <td><span className="mm-genre">{m.genre}</span></td>
                                    <td>{m.duration ? `${m.duration} phút` : '—'}</td>
                                    <td>
                                        <span className={`mm-badge ${STATUS_LABELS[m.status]?.cls || ''}`}>
                                            {STATUS_LABELS[m.status]?.label || m.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="mm-actions">
                                            {m.status === 'draft' && (
                                                <button
                                                    className="mm-btn-icon mm-btn-publish"
                                                    title="Xuất bản"
                                                    onClick={() => handlePublish(m.id)}
                                                >
                                                    <Save size={15} />
                                                </button>
                                            )}
                                            <button
                                                className="mm-btn-icon mm-btn-edit"
                                                title="Chỉnh sửa"
                                                onClick={() => setModal({ open: true, mode: 'edit', movie: m })}
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                className="mm-btn-icon mm-btn-del"
                                                title="Xoá"
                                                onClick={() => setConfirmDelete(m)}
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
            <div className="mm-pagination">
                <span className="mm-page-info">
                    Trang {params.pageNumber} / {data.totalPages}
                </span>
                <div className="mm-page-btns">
                    <button
                        className="mm-page-btn"
                        disabled={params.pageNumber <= 1}
                        onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber - 1 }))}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(pg => (
                        <button
                            key={pg}
                            className={`mm-page-btn ${pg === params.pageNumber ? 'active' : ''}`}
                            onClick={() => setParams(p => ({ ...p, pageNumber: pg }))}
                        >
                            {pg}
                        </button>
                    ))}
                    <button
                        className="mm-page-btn"
                        disabled={params.pageNumber >= data.totalPages}
                        onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber + 1 }))}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <select
                    className="mm-select-sm"
                    value={params.pageSize}
                    onChange={e => setParams(p => ({ ...p, pageSize: Number(e.target.value), pageNumber: 1 }))}
                >
                    {[5, 10, 20].map(n => <option key={n} value={n}>{n} / trang</option>)}
                </select>
            </div>

            {/* ── Form Modal ── */}
            {modal.open && (
                <MovieFormModal
                    mode={modal.mode}
                    movie={modal.movie}
                    onSave={handleSave}
                    onClose={() => setModal({ open: false })}
                />
            )}

            {/* ── Confirm Delete ── */}
            {confirmDelete && (
                <div className="mm-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="mm-confirm" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={32} className="mm-confirm-icon" />
                        <h3>Xác nhận xoá phim</h3>
                        <p>Bạn có chắc muốn xoá <strong>"{confirmDelete.title}"</strong>?<br />Hành động này không thể hoàn tác.</p>
                        <div className="mm-confirm-actions">
                            <button className="mm-btn-ghost" onClick={() => setConfirmDelete(null)}>Huỷ</button>
                            <button className="mm-btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Xoá phim</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieManager;
