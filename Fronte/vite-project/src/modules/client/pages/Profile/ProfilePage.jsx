import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        // Lấy thông tin user từ JWT payload
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserInfo({
                username: payload.sub,
                email: payload.email || 'Chưa cập nhật',
                role: payload.role || 'USER',
                fullName: payload.fullName || payload.sub,
            });
        } catch {
            setError('Không thể đọc thông tin người dùng.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    if (loading) return <div className="profile-loading">Đang tải...</div>;
    if (error) return <div className="profile-error">{error}</div>;

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-avatar-large">
                    {userInfo.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="profile-username">{userInfo.username}</h2>
                <p className="profile-role">{userInfo.role}</p>

                <div className="profile-info-list">
                    <div className="profile-info-item">
                        <span className="info-label">Tên người dùng</span>
                        <span className="info-value">{userInfo.fullName}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{userInfo.email}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="info-label">Tài khoản</span>
                        <span className="info-value">{userInfo.username}</span>
                    </div>
                </div>

                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Quay lại
                </button>
            </div>
        </div>
    );
}
