import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Search, 
    Ticket, 
    CheckCircle2, 
    AlertCircle, 
    User, 
    Calendar, 
    Clock, 
    MapPin, 
    Armchair,
    RefreshCw,
    XCircle,
    Info,
    Camera,
    CameraOff
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminTicketApi } from '../../../../services/adminTicketApi';
import './TicketScanner.css';

const TicketScanner = () => {
    const [orderCode, setOrderCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const inputRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    // Auto-focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const onScanSuccess = useCallback((decodedText) => {
        if (decodedText) {
            handleCheckIn(decodedText);
        }
    }, []);

    // Initialize/Cleanup Scanner
    useEffect(() => {
        // Only start scanning if isScanning is true and no result is showing
        if (isScanning && !result) {
            const startCamera = async () => {
                try {
                    // Give DOM a moment to render the 'reader' div
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const element = document.getElementById('reader');
                    if (!element) return;

                    const html5QrCode = new Html5Qrcode("reader");
                    html5QrCodeRef.current = html5QrCode;

                    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                    
                    await html5QrCode.start(
                        { facingMode: "environment" }, 
                        config, 
                        onScanSuccess
                    );
                    setCameraError(null);
                } catch (err) {
                    console.error("Unable to start camera", err);
                    setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
                    setIsScanning(false);
                }
            };

            startCamera();
        }

        return () => {
            // Cleanup: Stop the camera if it's running
            const stopCamera = async () => {
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                    try {
                        await html5QrCodeRef.current.stop();
                        html5QrCodeRef.current = null;
                    } catch (err) {
                        console.error("Failed to stop camera", err);
                    }
                }
            };
            stopCamera();
        };
    }, [isScanning, result, onScanSuccess]);

    const handleCheckIn = async (code) => {
        // Stop camera first
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (err) {
                console.error("Error stopping camera", err);
            }
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await adminTicketApi.scanTicket({ orderCode: code.trim() });
            setResult(res.data);
            setOrderCode(''); 
            setIsScanning(false); // Stop scanning mode when showing result
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi soát vé. Vui lòng kiểm tra lại mã đơn hàng.');
            setIsScanning(false);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e) => {
        if (e) e.preventDefault();
        if (!orderCode.trim()) return;
        handleCheckIn(orderCode);
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
        setOrderCode('');
        setCameraError(null);
        setIsScanning(true);
        if (inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    };

    return (
        <div className="ts-container">
            <div className="ts-header">
                <div className="ts-header-left">
                    <Search className="ts-icon" />
                    <div>
                        <h1>Hệ Thống Soát Vé</h1>
                        <p>Sử dụng Camera hoặc nhập mã đơn hàng để kiểm tra</p>
                    </div>
                </div>
                <button 
                    className={`ts-btn-toggle-camera ${isScanning ? 'active' : ''}`}
                    onClick={() => setIsScanning(!isScanning)}
                    disabled={loading || !!result}
                >
                    {isScanning ? <CameraOff size={18} /> : <Camera size={18} />}
                    <span>{isScanning ? 'Tắt Camera' : 'Bật Camera'}</span>
                </button>
            </div>

            <div className="ts-main-layout">
                <div className="ts-left-panel">
                    {/* Scanner Section */}
                    {isScanning && !result && (
                        <div className="ts-scanner-wrapper">
                            <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
                            {cameraError ? (
                                <div className="ts-camera-error">
                                    <AlertCircle size={20} />
                                    <span>{cameraError}</span>
                                </div>
                            ) : (
                                <div className="ts-scanner-hint">
                                    <Info size={14} />
                                    <span>Đưa mã QR/Barcode vào khung hình để quét</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Input Section */}
                    <div className="ts-scan-section">
                        <form className="ts-scan-form" onSubmit={handleManualSubmit}>
                            <div className="ts-input-group">
                                <Ticket className="ts-input-icon" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="NHẬP MÃ THỦ CÔNG (Ví dụ: DH123)"
                                    value={orderCode}
                                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" className="ts-btn-scan" disabled={loading || !orderCode.trim()}>
                                {loading ? <RefreshCw className="animate-spin" /> : 'KIỂM TRA'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="ts-right-panel">
                    <div className="ts-result-section">
                        {loading && <div className="ts-loader">Đang kiểm tra dữ liệu...</div>}

                        {error && (
                            <div className="ts-alert ts-alert-error">
                                <XCircle size={24} />
                                <div className="ts-alert-content">
                                    <h3>Lỗi soát vé</h3>
                                    <p>{error}</p>
                                    <button className="ts-btn-retry" onClick={handleReset}>Thử lại</button>
                                </div>
                            </div>
                        )}

                        {!result && !loading && !error && (
                            <div className="ts-empty-state">
                                <div className="ts-empty-icon">
                                    <Ticket size={48} />
                                </div>
                                <h3>Sẵn sàng soát vé</h3>
                                <p>Hệ thống đang chờ quét mã từ Camera hoặc nhập liệu thủ công.</p>
                            </div>
                        )}

                        {result && (
                            <div className={`ts-result-card ${result.isFullyCheckedIn ? 'warning' : 'success'}`}>
                                <div className="ts-result-header">
                                    {result.isFullyCheckedIn ? (
                                        <>
                                            <AlertCircle size={48} className="text-warning" />
                                            <div className="ts-status-info">
                                                <h2 className="text-warning">VÉ ĐÃ ĐƯỢC SỬ DỤNG</h2>
                                                <p>Đơn hàng: <strong>{result.orderCode}</strong></p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={48} className="text-success" />
                                            <div className="ts-status-info">
                                                <h2 className="text-success">VÉ HỢP LỆ</h2>
                                                <p>Đơn hàng: <strong>{result.orderCode}</strong></p>
                                            </div>
                                        </>
                                    )}
                                    <button className="ts-btn-clear" onClick={handleReset}>Quét tiếp</button>
                                </div>

                                <div className="ts-result-body">
                                    <div className="ts-info-grid">
                                        <div className="ts-info-item full">
                                            <label>Phim</label>
                                            <div className="ts-info-value large">{result.movieTitle}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label><Calendar size={14} /> Ngày chiếu</label>
                                            <div className="ts-info-value">{new Date(result.showtime).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label><Clock size={14} /> Giờ chiếu</label>
                                            <div className="ts-info-value">{new Date(result.showtime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label><MapPin size={14} /> Phòng chiếu</label>
                                            <div className="ts-info-value">{result.room}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label><Armchair size={14} /> Số lượng ghế</label>
                                            <div className="ts-info-value">{result.seats.length} ghế</div>
                                        </div>
                                    </div>

                                    <div className="ts-divider" />

                                    <div className="ts-seats-list">
                                        <label>Danh sách ghế:</label>
                                        <div className="ts-seats-grid">
                                            {result.seats.map((seat, idx) => (
                                                <div key={idx} className="ts-seat-badge">
                                                    <span className="ts-seat-label">{seat.seatLabel}</span>
                                                    <span className="ts-seat-type">{seat.seatType}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ts-divider" />

                                    <div className="ts-customer-info">
                                        <div className="ts-info-item">
                                            <label><User size={14} /> Khách hàng</label>
                                            <div className="ts-info-value">{result.customerName || 'Khách vãng lai'}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label>Số điện thoại</label>
                                            <div className="ts-info-value">{result.customerPhone || '—'}</div>
                                        </div>
                                        <div className="ts-info-item">
                                            <label>Tổng tiền</label>
                                            <div className="ts-info-value highlight">{result.totalAmount.toLocaleString()}đ</div>
                                        </div>
                                    </div>
                                </div>

                                {result.isFullyCheckedIn && (
                                    <div className="ts-warning-footer">
                                        <Info size={16} />
                                        <span>Vé này đã được quét vào hệ thống trước đó.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketScanner;
