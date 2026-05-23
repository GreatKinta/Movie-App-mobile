import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../modules/client/layouts/ClientLayout';
import HomePage from '../modules/client/pages/home/HomePage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import LichChieu from '../modules/client/pages/Schedule/LichChieu';
import BookingPage from '../modules/client/pages/booking/BookingPage/BookingPage';
import PaymentPage from '../modules/client/pages/payment/PaymentPage';
import MovieDetail from '../modules/client/pages/movie/MovieDetail';
import TicketPage from '../modules/client/pages/ticket/TicketPage';

import AdminLayout from '../modules/admin/layouts/AdminLayout';
import AdminRoute from './AdminRoute';
import AdminDashboard from '../modules/admin/pages/AdminDashboard/AdminDashboard';
import MovieManager from '../modules/admin/pages/MovieManager/MovieManager';
import ShowtimeManager from '../modules/admin/pages/ShowtimeManager/ShowtimeManager';
import TicketManager from '../modules/admin/pages/TicketManager/TicketManager';
import TicketScanner from '../modules/admin/pages/TicketScanner/TicketScanner';
import RoomManager from '../modules/admin/pages/RoomManager/RoomManager';
import SeatMapManager from '../modules/admin/pages/SeatMapManager/SeatMapManager';


const AppRoutes = () => {
    return (
        <Routes>
            {/* Client Routes */}
            <Route path="/" element={<ClientLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="lichchieu" element={<LichChieu />} />
                <Route path="booking/:id" element={<BookingPage />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="ticket" element={<TicketPage />} />
                <Route path="movie/:id" element={<MovieDetail />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />

                <Route path="rooms" element={<RoomManager />} />
                <Route path="rooms/:roomId/seats" element={<SeatMapManager />} />
                <Route path="movies" element={<MovieManager />} />
                <Route path="showtimes" element={<ShowtimeManager />} />
                <Route path="tickets" element={<TicketManager />} />
                <Route path="scan" element={<TicketScanner />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
