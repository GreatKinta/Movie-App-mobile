import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Đang tải quyền quản trị...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Backend đang trả về role có dạng chằng hạn như ADMIN, STAFF, CUSTOMER
    const role = typeof user.role === 'string' ? user.role.toUpperCase() : '';

    if (role === 'ADMIN' || role === 'STAFF') {
        return children;
    }

    // Nếu không phải admin thì đá về tran chủ
    return <Navigate to="/" replace />;
};

export default AdminRoute;
