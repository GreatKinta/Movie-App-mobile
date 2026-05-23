import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { CircleDollarSign, Fingerprint, Lock, ShieldCheck, User } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    
    // Default name based on the screenshot
    const displayName = user?.fullName || 'Hoàn Trần';

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1 className="welcome-text">Xin chào, {displayName}!</h1>
                <p className="welcome-subtext">Sau đây là những gì đang diễn ra tại hệ thống của bạn.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Doanh thu</span>
                        <div className="stat-icon" style={{backgroundColor: '#e0faea'}}>
                            <CircleDollarSign size={20} color="#10b981" />
                        </div>
                    </div>
                    <div className="stat-value">4.10tr</div>
                    <div className="stat-footer negative">
                        <span>So với tháng trước</span>
                        <span className="trend">↘ -72.8 </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Tổng vé</span>
                        <div className="stat-icon" style={{backgroundColor: '#e6f0ff'}}>
                            <Lock size={20} color="#3b82f6" />
                        </div>
                    </div>
                    <div className="stat-value">24</div>
                    <div className="stat-footer negative">
                        <span>So với tháng trước</span>
                        <span className="trend">↘ -76.9 </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Khách hàng mới</span>
                        <div className="stat-icon" style={{backgroundColor: '#fffbeb'}}>
                            <User size={20} color="#f59e0b" />
                        </div>
                    </div>
                    <div className="stat-value">1</div>
                    <div className="stat-footer negative">
                        <span>So với tháng trước</span>
                        <span className="trend">↘ -50 </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Tỷ lệ khách hàng quay lại</span>
                        <div className="stat-icon" style={{backgroundColor: '#eef2ff'}}>
                            <ShieldCheck size={20} color="#6366f1" />
                        </div>
                    </div>
                    <div className="stat-value">100%</div>
                    <div className="stat-footer">
                        <span>Trong tháng 4-2025</span>
                    </div>
                </div>
            </div>

            <div className="chart-container">
                <h3 className="chart-title">Doanh thu theo thời gian</h3>
                
                <div style={{ marginLeft: "60px", marginRight: "20px" }}>
                    <div className="chart-placeholder">
                        <div className="y-axis-labels">
                            <span>3.316.190 ₫</span>
                            <span>2.487.143 ₫</span>
                            <span style={{transform: "rotate(-90deg)", position: "absolute", left: "-60px", top: "150px", fontWeight: 600}}>Doanh thu</span>
                            <span>1.658.095 ₫</span>
                            <span>829.048 ₫</span>
                            <span>0 ₫</span>
                        </div>

                        <div className="mock-chart-line">
                            {/* A simple curved SVG mock line graph matching the screenshot curve */}
                            <svg viewBox="0 0 1000 350" preserveAspectRatio="none">
                                <path 
                                    d="M 20 300 Q 400 300, 600 200 T 980 50" 
                                    fill="none" 
                                    stroke="#06b6d4" 
                                    strokeWidth="6" 
                                    strokeLinecap="round" 
                                />
                                <circle cx="20" cy="300" r="4" fill="#06b6d4" />
                                <circle cx="980" cy="50" r="4" fill="#06b6d4" />
                            </svg>
                        </div>

                        <div className="x-axis-labels">
                            <span>00:00</span>
                            <span>02:00</span>
                            <span>04:00</span>
                            <span>06:00</span>
                            <span>08:00</span>
                            <span>10:00</span>
                            <span>12:00</span>
                            <span>14:00</span>
                            <span>16:00</span>
                            <span>18:00</span>
                            <span>20:00</span>
                            <span>22:00</span>
                            <span>03 Apr</span>
                            <span>02:00</span>
                            <span>04:00</span>
                            <span>06:00</span>
                            <span>08:00</span>
                            <span>10:00</span>
                            <span>12:00</span>
                            <span>14:00</span>
                            <span>16:00</span>
                            <span>18:00</span>
                            <span>20:00</span>
                            <span>22:00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
