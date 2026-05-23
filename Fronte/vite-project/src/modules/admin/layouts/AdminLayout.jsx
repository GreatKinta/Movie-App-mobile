import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Film,
    Ticket,
    LogOut,
    Menu,
    ChevronDown,
    ChevronUp,
    Maximize,
    Moon,
    Sun,
    MonitorPlay,
    UserCircle,
    Scan
} from 'lucide-react';

import './AdminLayout.css';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('adminDarkMode');
        return savedTheme === 'true';
    });
    
    const [openSubmenu, setOpenSubmenu] = useState({
        cinema: false,
        movie: false,
        service: false,
        content: false,
        account: false
    });

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newValue = !prev;
            localStorage.setItem('adminDarkMode', newValue);
            return newValue;
        });
    };

    return (
        <div className={`admin-container ${isDarkMode ? 'dark-theme' : ''}`}>
            {/* Sidebar */}
            <aside className={`admin-sidebar ${!isMenuOpen ? 'closed' : ''}`}>
                <div className="sidebar-logo">
                    <h2>BEECINEMA</h2>
                </div>

                <div className="sidebar-menu-title">MENU</div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                <LayoutDashboard size={18} />
                                <span>Tổng quan</span>
                            </NavLink>
                        </li>

                        {/* Fake thong ke */}
                        <li className={`nav-item-dropdown ${openSubmenu.cinema ? 'open' : ''}`}>
                            <div className="nav-link" onClick={() => toggleSubmenu('cinema')}>
                                <Building2 size={18} />
                                <span>Hệ thống rạp</span>
                                {openSubmenu.cinema ? <ChevronUp size={16} className="chevron" /> : <ChevronDown size={16} className="chevron" />}
                            </div>
                            <ul className="submenu">
                                <li>
                                    <NavLink to="/admin/rooms" className={({ isActive }) => isActive ? 'sub-nav-link active' : 'sub-nav-link'}>
                                        Quản lý phòng
                                    </NavLink>
                                </li>
                            </ul>
                        </li>

                        <li className={`nav-item-dropdown ${openSubmenu.movie ? 'open' : ''}`}>
                            <div className="nav-link" onClick={() => toggleSubmenu('movie')}>
                                <Film size={18} />
                                <span>Phim và Xuất Chiếu</span>
                                {openSubmenu.movie ? <ChevronUp size={16} className="chevron" /> : <ChevronDown size={16} className="chevron" />}
                            </div>
                            <ul className="submenu">
                                <li>
                                    <NavLink to="/admin/movies" className={({ isActive }) => isActive ? 'sub-nav-link active' : 'sub-nav-link'}>
                                        Quản lý phim
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/showtimes" className={({ isActive }) => isActive ? 'sub-nav-link active' : 'sub-nav-link'}>
                                        Quản lý suất chiếu
                                    </NavLink>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <NavLink to="/admin/tickets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                <Ticket size={18} />
                                <span>Tạo vé</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/scan" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                                <Scan size={18} />
                                <span>Soát vé</span>
                            </NavLink>
                        </li>
                    </ul>

                </nav>
            </aside>

            {/* Main Content Area */}
            <div className={`admin-main ${!isMenuOpen ? 'expanded' : ''}`}>
                {/* Header */}
                <header className="admin-header">
                    <div className="header-left">
                        <button className="toggle-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <Menu size={20} />
                        </button>
                    </div>
                    <div className="header-right">
                        <div className="header-icons">
                            <button className="icon-btn">
                                <MonitorPlay size={18} />
                            </button>
                            <button className="icon-btn" onClick={() => navigate('/admin/scan')} title="Truy cập nhanh Soát vé">
                                <Scan size={18} />
                            </button>
                            <button className="icon-btn" onClick={toggleTheme} title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}>
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>

                        <div className="user-profile">
                            <div className="user-avatar" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Click để đăng xuất">
                                <UserCircle size={36} color="#465b8a" />
                            </div>
                            <div className="user-info">
                                <span className="user-role">{user?.role || 'Admin'}</span>
                                <span className="user-name">{user?.fullName || 'Người Dùng'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
