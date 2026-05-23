import React, { useState, useEffect, useRef } from 'react'; // 1. Import useState, useEffect, useRef
import { Link, useNavigate } from 'react-router-dom';
import './header.css';
import { useAuth } from '../../../../context/AuthContext';

export default function Header() {
    // 2. Khởi tạo biến Active Tab
    const [activeTab, setActiveTab] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/');
    };

    return (
        <div className="header-wrapper">
            {/* Top Bar giữ nguyên ... */}
            <div className="top-bar">
                <div className="container top-bar-content">
                    <div className="auth-links">
                        {user ? (
                            <div className="user-menu" ref={dropdownRef}>
                                <button
                                    className="user-btn"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <span className="user-avatar">
                                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                                    </span>
                                    <span className="user-name">{user.fullName || user.username}</span>
                                    <span className="chevron">{dropdownOpen ? '▲' : '▼'}</span>
                                </button>

                                {dropdownOpen && (
                                    <div className="dropdown-menu">
                                        <Link
                                            to="/profile"
                                            className="dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            👤 Thông tin cá nhân
                                        </Link>
                                        <button
                                            className="dropdown-item dropdown-logout"
                                            onClick={handleLogout}
                                        >
                                            🚪 Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login">Đăng nhập</Link>
                                <span className="divider">|</span>
                                <Link to="/register">Đăng ký</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <header className="main-header">
                <div className="container main-header-content">
                    <div className="logo">
                        <Link to="/" onClick={() => setActiveTab('')}> {/* Về trang chủ thì reset active */}
                            <h1 className="logo-text">MY<span className="logo-highlight">CINEMA</span></h1>
                        </Link>
                    </div>

                    <nav className="main-nav">
                        <ul>
                            {/* 3. Sửa lại logic active cho từng mục */}
                            <li>
                                <Link to="/lichchieu"
                                    className={`tab-btn ${activeTab === 'lich_chieu' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('lich_chieu')}>
                                    LỊCH CHIẾU
                                </Link>
                            </li>
                            <li>
                                <Link to="/"
                                    className={`tab-btn ${activeTab === 'phim' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('phim')}>
                                    PHIM
                                </Link>
                            </li>
                            <li>
                                <Link to="/"
                                    className={`tab-btn ${activeTab === 'gia_ve' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('gia_ve')}>
                                    GIÁ VÉ
                                </Link>
                            </li>
                            <li>
                                <Link to="/"
                                    className={`tab-btn ${activeTab === 'nhuong_quyen' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('nhuong_quyen')}>
                                    NHƯỢNG QUYỀN
                                </Link>
                            </li>
                            <li>
                                <Link to="/"
                                    className={`tab-btn ${activeTab === 'thanh_vien' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('thanh_vien')}>
                                    THÀNH VIÊN
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        </div>
    );
}