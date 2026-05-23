import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        {/* Column 1: Logo and General Links */}
        <div className="footer-column">
          <div className="footer-logo">
            {/* Replace with actual logo image later */}
            <h2 className="logo-text-footer">MY<span className="logo-highlight-footer">CINEMAS</span></h2>
          </div>
          <ul className="footer-links">
            <li><a href="#">Tuyện dụng</a></li>
            <li><a href="#">Giới thiệu</a></li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#">F.A.Q</a></li>
            <li><a href="#">Hoạt động xã hội</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
            <li><a href="#">Chính sách thanh toán, đổi trả - hoàn vé</a></li>
            <li><a href="#">Liên hệ quảng cáo</a></li>
            <li><a href="#">Điều khoản bảo mật</a></li>
            <li><a href="#">Hướng dẫn đặt vé online</a></li>
          </ul>
          <div className="footer-app-section">
            <h3 className="column-title">TẢI ỨNG DỤNG</h3>
            <ul className="footer-links">
              <li><a href="#">Beta Cinemas cho iOS</a></li>
              <li><a href="#">Beta Cinemas cho Android</a></li>
            </ul>
          </div>
        </div>

        {/* Column 2: Cinema Locations */}
        <div className="footer-column">
          <h3 className="column-title">CỤM RẠP BETA</h3>
          <ul className="footer-links cinema-list">
            <li><a href="#">&gt; Beta Cinemas Xuân Thủy, Hà Nội</a></li>
            <li><a href="#">&gt; Beta Cinemas Tây Sơn, Hà Nội</a></li>
            <li><a href="#">&gt; Beta Cinemas Vinh Yên, Phú Thọ</a></li>
            <li><a href="#">&gt; Beta Cinemas Ung Văn Khiêm, TP HCM</a></li>
            <li><a href="#">&gt; Beta Cinemas Lào Cai</a></li>
            <li><a href="#">&gt; Beta Cinemas Trần Quang Khải, TP HCM</a></li>
            <li><a href="#">&gt; Beta Cinemas TrMall Phú Quốc</a></li>
            <li><a href="#">&gt; Beta Cinemas Empire Bình Dương</a></li>
            <li><a href="#">&gt; Beta Cinemas Quang Trung, TP HCM</a></li>
            <li><a href="#">&gt; Beta Cinemas Giải Phóng, Hà Nội</a></li>
            {/* Add more as needed */}
          </ul>
        </div>

        {/* Column 3: Contact and Connect */}
        <div className="footer-column">
          <h3 className="column-title">LIÊN HỆ</h3>
          <div className="contact-info">
            <p><strong>CÔNG TY CỔ PHẦN BETA MEDIA</strong></p>
            <p>Giấy chứng nhận ĐKKD số: 0106633482 - Đăng ký lần đầu ngày 08/09/2014 tại Sở Kế hoạch và Đầu tư Thành phố Hà Nội</p>
            <p>Địa chỉ trụ sở: Tầng 3, số 595, đường Giải Phóng, Phường Tương Mai, Thành phố Hà Nội, Việt Nam</p>
            
            <div className="contact-detail">
              <p><strong>LIÊN HỆ CHĂM SÓC KHÁCH HÀNG:</strong></p>
              <p>Hotline: 1900 636807</p>
              <p>Email: mkt@betacinemas.vn</p>
            </div>

            <div className="contact-detail">
              <p><strong>LIÊN HỆ QUẢNG CÁO:</strong></p>
              <p>Hotline: 0934 632 682</p>
              <p>Email: ad@betagroup.vn</p>
            </div>
          </div>

          <div className="social-section">
            <h3 className="column-title">KẾT NỐI VỚI CHÚNG TÔI</h3>
            <div className="social-icons">
              <a href="#" className="social-icon">F</a>
              <a href="#" className="social-icon">Y</a>
              <a href="#" className="social-icon">T</a>
              <a href="#" className="social-icon">I</a>
            </div>
            <div className="notified-badge">
              <div className="badge-placeholder">ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 MYCINEMA. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
