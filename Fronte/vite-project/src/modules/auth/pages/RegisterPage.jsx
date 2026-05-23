import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './LoginPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (form.password !== form.confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                username: form.username.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phoneNumber: form.phone.trim(),
                password: form.password
            });

            if (response.status === 200) {
                alert('Đăng ký thành công!');
                navigate('/login');
            } else {
                setErrorMessage('Dữ liệu không hợp lệ, vui lòng kiểm tra lại!');
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            if (error.response) {
                const msg = error.response.data?.message || 'Đăng ký thất bại. Email hoặc tên đăng nhập đã tồn tại!';
                setErrorMessage(msg);
            } else {
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
            }
        }
    };

    const passwordMatch = form.confirmPassword && form.password === form.confirmPassword;
    const passwordNotMatch = form.confirmPassword && form.password !== form.confirmPassword;

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="auth-header">
                    <h2>Đăng Ký</h2>
                    <div className="auth-divider-line"></div>
                    <p>Tạo tài khoản để đặt vé nhanh hơn!</p>
                </div>

                {errorMessage && (
                    <div className="auth-error-message" style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', border: '1px solid #e74c3c' }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Tên đăng nhập</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Viết liền không dấu..."
                            maxLength={50}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName">Họ và tên</label>
                        <input
                            id="fullName"
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên đầy đủ..."
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ email..."
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại..."
                            maxLength={15}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Tối thiểu 8 ký tự..."
                                maxLength={100}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '-.-' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu..."
                            maxLength={100}
                            required
                            style={{
                                borderColor: passwordMatch ? '#2ecc71'
                                    : passwordNotMatch ? '#e74c3c'
                                        : undefined
                            }}
                        />
                        {passwordNotMatch && (
                            <span style={{ fontSize: 12, color: '#e74c3c', marginTop: 4, display: 'block' }}>
                                Mật khẩu không khớp!
                            </span>
                        )}
                        {passwordMatch && (
                            <span style={{ fontSize: 12, color: '#2ecc71', marginTop: 4, display: 'block' }}>
                                Mật khẩu khớp ✓
                            </span>
                        )}
                    </div>

                    <button type="submit" className="btn-submit">
                        TẠO TÀI KHOẢN
                    </button>
                </form>

                <p className="switch-auth">
                    Đã có tài khoản?{' '}
                    <Link to="/login">Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;