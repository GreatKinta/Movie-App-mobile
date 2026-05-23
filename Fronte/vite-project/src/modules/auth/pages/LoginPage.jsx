import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoadingOverlay from '../../../shared/components/LoadingOverlay/LoadingOverlay';
import api from '../../../services/api';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: form.email.trim(),
                password: form.password
            });

            if (response.status === 200) {
                const data = response.data;
                // Lưu token vào localStorage để interceptor trong api.js tự động nhận diện!
                localStorage.setItem('token', data.accessToken);
                setIsSuccess(true);
                await login();

                setTimeout(async () => {
                    try {
                        // Giải mã JWT accessToken để lấy quyền
                        const { jwtDecode } = await import('jwt-decode');
                        const decoded = jwtDecode(data.accessToken);
                        const role = typeof decoded.role === 'string' ? decoded.role.toUpperCase() : '';

                        if (role === 'ADMIN' || role === 'STAFF') {
                            // Theo yêu cầu, mở trang Admin ở một tab mới
                            window.open('/admin', '_blank');
                            // Tab hiện tại (Web khách) chuyển về trang chủ
                            navigate('/');
                        } else {
                            navigate('/'); // Chuyển hướng về trang chủ
                        }
                    } catch (decodeError) {
                        console.error("Lỗi khi giải mã token:", decodeError);
                        navigate('/');
                    }
                }, 1500); // Wait 1.5s to show overlay
            } else {
                setErrorMessage('Email/Tên đăng nhập hoặc mật khẩu không chính xác!');
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            // Axios ném lỗi cho mọi status 4xx/5xx — cần phân biệt
            if (error.response) {
                // Có response từ server (401 sai mật khẩu, 400 validation...)
                const msg = error.response.data?.message || 'Email hoặc mật khẩu không đúng!';
                setErrorMessage(msg);
            } else {
                // Không kết nối được server (network error)
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {isSuccess && <LoadingOverlay text="Loading..." />}
            <div className="login-container">
                <div className="auth-header">
                    <h2>Đăng Nhập</h2>
                    <div className="auth-divider-line"></div>
                    <p>Chào mừng bạn trở lại với MyCinema!</p>
                </div>

                {errorMessage && (
                    <div className="auth-error-message" style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', border: '1px solid #e74c3c' }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu..."
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

                    <div className="form-options">
                        <a href="#" className="forgot-link">Quên mật khẩu?</a>
                    </div>

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading && !isSuccess ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                    </button>

                    <div className="or-divider">hoặc đăng nhập với</div>

                    <div className="social-buttons">
                        <button type="button" className="btn-social">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button type="button" className="btn-social">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>
                </form>

                <p className="switch-auth">
                    Chưa có tài khoản?{' '}
                    <Link to="/register">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;