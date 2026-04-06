import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import Login from '../pages/user/Login.jsx';
import Register from '@/pages/user/Register';
import ForgotPassword from '../pages/user/ForgotPassword';
import CheckOTP from '../pages/user/CheckOTP';
import ResetPassword from '../pages/user/ResetPassword';
export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/profile/*' element={<UserRoutes />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/check-otp" element={<CheckOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
    );
}
