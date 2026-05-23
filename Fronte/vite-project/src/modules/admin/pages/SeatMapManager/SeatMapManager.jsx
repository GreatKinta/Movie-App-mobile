import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RotateCcw, Info,
    AlertTriangle, CheckCircle2, Grid3x3, Trash2
} from 'lucide-react';
import { adminSeatApi } from '../../../../services/adminSeatApi';
import './SeatMapManager.css';

// ── Seat Type Color Map ────────────────────────────────────────────────────
// Màu sắc cho từng loại ghế — sẽ rotate theo index nếu có nhiều loại mới
const TYPE_COLORS = [
    { bg: 'rgba(56,139,253,0.18)', border: 'rgba(56,139,253,0.5)',   text: '#79c0ff',  activeBg: '#1f6feb' },   // Normal → Blue
    { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.5)',   text: '#fcd34d',  activeBg: '#d97706' },   // VIP → Amber
    { bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.5)',   text: '#f9a8d4',  activeBg: '#db2777' },   // Couple → Pink
    { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.5)',   text: '#6ee7b7',  activeBg: '#059669' },   // Extra 1 → Emerald
    { bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.5)',   text: '#c4b5fd',  activeBg: '#7c3aed' },   // Extra 2 → Purple
];

const ERASER_TYPE_ID = -1;
const ERASER_COLOR = { bg: 'transparent', border: '#ef4444', text: '#ef4444', activeBg: 'rgba(239,68,68,0.2)' };

const SeatMapManager = () => {
    const { roomId } = useParams();
    const navigate   = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────
    const [seats,       setSeats]       = useState([]);      // Tất cả ghế từ API
    const [seatTypes,   setSeatTypes]   = useState([]);      // Loại ghế từ API
    const [localSeats,  setLocalSeats]  = useState({});      // Map seatId → seatTypeId (local edits)
    const [selectedType, setSelectedType] = useState(null);  // Loại đang chọn để "vẽ"
    const [isDirty,     setIsDirty]     = useState(false);   // Có thay đổi chưa lưu
    const [loading,     setLoading]     = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState(null);
    const [toast,       setToast]       = useState(null);
    const [roomName,    setRoomName]    = useState('');
    const [generateForm, setGenerateForm] = useState({ rows: 5, columns: 10 });
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const isPainting = useRef(false);    // Hỗ trợ click-drag để vẽ nhiều ghế

    // ── Fetch data ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [seatsRes, typesRes] = await Promise.all([
                adminSeatApi.getSeatsByRoom(roomId),
                adminSeatApi.getSeatTypes(),
            ]);

            const seatsData = seatsRes.data;
            const typesData = typesRes.data;

            setSeats(seatsData);
            setSeatTypes(typesData);

            // Khởi tạo local state từ dữ liệu server
            const initMap = {};
            seatsData.forEach(s => { initMap[s.seatId] = s.seatType.seatTypeId; });
            setLocalSeats(initMap);
            setIsDirty(false);

            // Chọn loại đầu tiên làm mặc định
            if (typesData.length > 0) setSelectedType(typesData[0].seatTypeId);
        } catch {
            setError('Không thể tải dữ liệu sơ đồ ghế. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Lấy tên phòng từ API rooms nếu cần
    useEffect(() => {
        import('../../../../services/adminRoomApi').then(({ adminRoomApi }) => {
            adminRoomApi.getRoomById(roomId)
                .then(res => setRoomName(res.data.name))
                .catch(() => setRoomName(`Phòng #${roomId}`));
        });
    }, [roomId]);

    // ── Toast helper ───────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Seat click handler ─────────────────────────────────────────────────
    const paintSeat = useCallback((seatId) => {
        if (selectedType === null) return;
        setLocalSeats(prev => {
            if (prev[seatId] === selectedType) return prev; // Không thay đổi
            setIsDirty(true);
            return { ...prev, [seatId]: selectedType };
        });
    }, [selectedType]);

    // ── Save handler ───────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!isDirty) return;

        // --- KIỂM TRA RÀNG BUỘC GHẾ ĐÔI BẮT BUỘC PHẢI LÀ SỐ CHẴN TRÊN MỖI HÀNG ---
        const coupleType = seatTypes.find(t => 
            t.name.toLowerCase() === 'couple' || 
            t.name.toLowerCase() === 'đôi' || 
            t.name.toLowerCase().includes('đôi') || 
            t.name.toLowerCase().includes('couple')
        );

        if (coupleType) {
            const coupleTypeId = coupleType.seatTypeId;
            const coupleSeatsByRow = {};

            // Nhóm các ghế được vẽ làm ghế đôi theo tên hàng
            seats.forEach(s => {
                const currentTypeId = localSeats[s.seatId];
                if (currentTypeId === coupleTypeId) {
                    if (!coupleSeatsByRow[s.rowName]) {
                        coupleSeatsByRow[s.rowName] = [];
                    }
                    coupleSeatsByRow[s.rowName].push(s);
                }
            });

            // Kiểm tra từng hàng
            for (const [rowName, rowSeats] of Object.entries(coupleSeatsByRow)) {
                if (rowSeats.length % 2 !== 0) {
                    showToast(
                        `Hàng ${rowName} đang có ${rowSeats.length} ghế đôi (số lẻ). Số lượng ghế đôi trong mỗi hàng bắt buộc phải là số chẵn để ghép thành cặp!`, 
                        'error'
                    );
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const seatsPayload = Object.entries(localSeats).map(([seatId, seatTypeId]) => ({
                seatId: Number(seatId),
                seatTypeId,
            }));
            await adminSeatApi.updateSeatMap(roomId, { seats: seatsPayload });
            setIsDirty(false);
            showToast('Đã lưu sơ đồ ghế thành công!');
            fetchData(); // Re-sync với server
        } catch (e) {
            showToast(e.response?.data?.message || 'Lỗi khi lưu sơ đồ ghế.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Reset handler ──────────────────────────────────────────────────────
    const handleReset = () => {
        const initMap = {};
        seats.forEach(s => { initMap[s.seatId] = s.seatType.seatTypeId; });
        setLocalSeats(initMap);
        setIsDirty(false);
        showToast('Đã hoàn tác về trạng thái ban đầu.', 'info');
    };

    // ── Clear Map handler ───────────────────────────────────────────────────
    const handleClearMap = async () => {
        setIsClearing(true);
        try {
            await adminSeatApi.clearSeatMap(roomId);
            showToast('Đã xoá toàn bộ sơ đồ ghế thành công!');
            setConfirmClear(false);
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || 'Lỗi khi xoá sơ đồ ghế.', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    // ── Generate handler ───────────────────────────────────────────────────
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await adminSeatApi.generateSeatMap(roomId, generateForm);
            showToast('Đã khởi tạo sơ đồ ghế thành công!');
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || 'Lỗi khi khởi tạo sơ đồ.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Build grid rows ────────────────────────────────────────────────────
    const rows = seats.reduce((acc, seat) => {
        if (!acc[seat.rowName]) acc[seat.rowName] = [];
        acc[seat.rowName].push(seat);
        return acc;
    }, {});
    const sortedRows = Object.keys(rows).sort();

    // Map seatTypeId → color index
    const typeColorMap = {};
    seatTypes.forEach((t, i) => {
        typeColorMap[t.seatTypeId] = TYPE_COLORS[i % TYPE_COLORS.length];
    });

    // ── Render ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="sm-page">
                <div className="sm-loading-center">
                    <div className="sm-spinner" />
                    <p>Đang tải sơ đồ ghế...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sm-page">
                <div className="sm-error-center">
                    <AlertTriangle size={40} />
                    <p>{error}</p>
                    <button className="sm-btn-primary" onClick={fetchData}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="sm-page"
            onMouseUp={() => { isPainting.current = false; }}
        >
            {/* ── Toast ── */}
            {toast && (
                <div className={`sm-toast sm-toast--${toast.type}`}>
                    {toast.type === 'error'   ? <AlertTriangle size={16} /> :
                     toast.type === 'success' ? <CheckCircle2  size={16} /> :
                                                <Info          size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="sm-header">
                <div className="sm-header-left">
                    <button className="sm-btn-back" onClick={() => navigate('/admin/rooms')}>
                        <ArrowLeft size={18} />
                    </button>
                    <Grid3x3 size={22} className="sm-header-icon" />
                    <div>
                        <h1 className="sm-title">Sơ Đồ Ghế — {roomName}</h1>
                        <p className="sm-subtitle">
                            {seats.length} ghế · {sortedRows.length} hàng
                            {isDirty && <span className="sm-dirty-badge"> · Có thay đổi chưa lưu</span>}
                        </p>
                    </div>
                </div>
                <div className="sm-header-actions">
                    {seats.length > 0 && (
                        <button className="sm-btn-danger" onClick={() => setConfirmClear(true)} disabled={saving || isGenerating}>
                            <Trash2 size={15} /> Xoá sơ đồ
                        </button>
                    )}
                    {isDirty && (
                        <button className="sm-btn-ghost" onClick={handleReset} disabled={saving}>
                            <RotateCcw size={15} /> Hoàn tác
                        </button>
                    )}
                    <button
                        className={`sm-btn-primary ${!isDirty ? 'sm-btn-primary--disabled' : ''}`}
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                    >
                        <Save size={15} />
                        {saving ? 'Đang lưu...' : 'Lưu sơ đồ'}
                    </button>
                </div>
            </div>

            {/* ── Legend & Type Selector ── */}
            <div className="sm-legend-bar">
                <span className="sm-legend-title">Chọn loại ghế để vẽ:</span>
                <div className="sm-legend-types">
                    {seatTypes.map((t, i) => {
                        const color = TYPE_COLORS[i % TYPE_COLORS.length];
                        const isActive = selectedType === t.seatTypeId;
                        return (
                            <button
                                key={t.seatTypeId}
                                className={`sm-legend-item ${isActive ? 'sm-legend-item--active' : ''}`}
                                style={{
                                    '--type-bg':     isActive ? color.activeBg : color.bg,
                                    '--type-border': color.border,
                                    '--type-text':   isActive ? '#fff' : color.text,
                                }}
                                onClick={() => setSelectedType(t.seatTypeId)}
                            >
                                <span className="sm-legend-dot" style={{ background: isActive ? '#fff' : color.text }} />
                                {t.name}
                                {t.surcharge > 0 && (
                                    <span className="sm-legend-price">+{t.surcharge.toLocaleString('vi-VN')}đ</span>
                                )}
                            </button>
                        );
                    })}
                    {/* Eraser Tool */}
                    <button
                        className={`sm-legend-item ${selectedType === ERASER_TYPE_ID ? 'sm-legend-item--active' : ''}`}
                        style={{
                            '--type-bg':     selectedType === ERASER_TYPE_ID ? ERASER_COLOR.activeBg : ERASER_COLOR.bg,
                            '--type-border': ERASER_COLOR.border,
                            '--type-text':   selectedType === ERASER_TYPE_ID ? '#fff' : ERASER_COLOR.text,
                        }}
                        onClick={() => setSelectedType(ERASER_TYPE_ID)}
                    >
                        <Trash2 size={14} style={{ marginRight: 4 }} />
                        Xoá ghế
                    </button>
                </div>
                <p className="sm-legend-hint">
                    <Info size={13} /> Click hoặc kéo thả lên nhiều ghế để thay đổi loại.
                </p>
            </div>

            {/* ── Seat Grid ── */}
            <div className="sm-grid-container">
                {/* Screen indicator */}
                <div className="sm-screen">
                    <div className="sm-screen-bar" />
                    <span className="sm-screen-label">MÀN HÌNH</span>
                </div>

                {/* Rows */}
                <div className="sm-grid">
                    {sortedRows.length === 0 ? (
                        <div className="sm-no-seats">
                            <Grid3x3 size={48} />
                            <p style={{ marginBottom: 16 }}>Phòng này chưa có sơ đồ ghế. Bạn có thể tự động tạo một lưới ghế trống.</p>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, background: 'rgba(0,0,0,0.2)', padding: '16px 24px', borderRadius: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Số Hàng (A-Z)</label>
                                    <input 
                                        type="number" min="1" max="26" 
                                        value={generateForm.rows} 
                                        onChange={e => setGenerateForm(prev => ({...prev, rows: Number(e.target.value)}))}
                                        style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 8, width: 80 }}
                                    />
                                </div>
                                <div style={{ color: '#8b949e' }}>X</div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Số Cột (1-100)</label>
                                    <input 
                                        type="number" min="1" max="100" 
                                        value={generateForm.columns} 
                                        onChange={e => setGenerateForm(prev => ({...prev, columns: Number(e.target.value)}))}
                                        style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 8, width: 80 }}
                                    />
                                </div>
                            </div>
                            <button 
                                className="sm-btn-primary" 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Đang tạo...' : 'Khởi Tạo Sơ Đồ Ghế'}
                            </button>
                        </div>
                    ) : sortedRows.map(rowName => (
                        <div key={rowName} className="sm-row">
                            <span className="sm-row-label">{rowName}</span>
                            <div className="sm-row-seats">
                                {rows[rowName]
                                    .sort((a, b) => a.seatNumber - b.seatNumber)
                                    .map(seat => {
                                        const currentTypeId = localSeats[seat.seatId] ?? seat.seatType.seatTypeId;
                                        const isEraser = currentTypeId === ERASER_TYPE_ID;
                                        const typeIdx = seatTypes.findIndex(t => t.seatTypeId === currentTypeId);
                                        const color = isEraser ? ERASER_COLOR : TYPE_COLORS[typeIdx >= 0 ? typeIdx % TYPE_COLORS.length : 0];
                                        const isChanged = localSeats[seat.seatId] !== seat.seatType.seatTypeId;

                                        return (
                                            <button
                                                key={seat.seatId}
                                                className={`sm-seat ${isChanged ? 'sm-seat--changed' : ''} ${isEraser ? 'sm-seat--eraser' : ''}`}
                                                style={{
                                                    '--seat-bg':     color.bg,
                                                    '--seat-border': color.border,
                                                    '--seat-text':   color.text,
                                                }}
                                                title={`${rowName}${seat.seatNumber} — ${
                                                    isEraser ? 'Sẽ bị xoá' : (seatTypes.find(t => t.seatTypeId === currentTypeId)?.name ?? '?')
                                                }${isChanged ? ' (đã thay đổi)' : ''}`}
                                                onMouseDown={() => {
                                                    isPainting.current = true;
                                                    paintSeat(seat.seatId);
                                                }}
                                                onMouseEnter={() => {
                                                    if (isPainting.current) paintSeat(seat.seatId);
                                                }}
                                                onMouseUp={() => { isPainting.current = false; }}
                                            >
                                                {!isEraser && seat.seatNumber}
                                                {isChanged && !isEraser && <span className="sm-seat-dot" />}
                                                {isEraser && <Trash2 size={14} color="#ef4444" />}
                                            </button>
                                        );
                                    })}
                            </div>
                            <span className="sm-row-label">{rowName}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="sm-stats">
                {seatTypes.map((t, i) => {
                    const count = Object.values(localSeats).filter(id => id === t.seatTypeId).length;
                    const color = TYPE_COLORS[i % TYPE_COLORS.length];
                    return (
                        <div
                            key={t.seatTypeId}
                            className="sm-stat-card"
                            style={{ '--card-border': color.border, '--card-bg': color.bg }}
                        >
                            <span className="sm-stat-dot" style={{ background: color.text }} />
                            <div>
                                <div className="sm-stat-name">{t.name}</div>
                                <div className="sm-stat-count" style={{ color: color.text }}>{count} ghế</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Confirm Clear Modal ── */}
            {confirmClear && (
                <div className="sm-overlay" onClick={() => setConfirmClear(false)}>
                    <div className="sm-confirm" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={32} className="sm-confirm-icon" />
                        <h3>Xác nhận xoá sơ đồ ghế</h3>
                        <p>
                            Bạn có chắc muốn xoá toàn bộ sơ đồ ghế của phòng <strong>{roomName}</strong>?<br />
                            Hành động này không thể hoàn tác. Bạn sẽ phải tạo lại lưới ghế từ đầu.
                        </p>
                        <div className="sm-confirm-actions">
                            <button className="sm-btn-ghost" onClick={() => setConfirmClear(false)}>Huỷ</button>
                            <button className="sm-btn-danger" onClick={handleClearMap} disabled={isClearing}>
                                {isClearing ? 'Đang xoá...' : 'Xoá sơ đồ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatMapManager;
