import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import CartPage from '../pages/user/cart/CartPage';
import ProductRoutes from './ProductRoutes';
import Login from '../pages/user/Login.jsx';
import Register from '@/pages/user/Register';
import ForgotPassword from '../pages/user/ForgotPassword';
import CheckOTP from '../pages/user/CheckOTP';
import ResetPassword from '../pages/user/ResetPassword';
import AdminRoutes from './AdminRoutes';
import CheckoutPage from '@/pages/user/checkout/CheckoutPage';


export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path='/'
                element={
                    <MainLayout>
                        <HomePage />
                    </MainLayout>
                }
            />

            <Route
                path='/products/*'
                element={
                    <MainLayout>
                        <ProductRoutes />
                    </MainLayout>
                }
            />

            <Route path='/profile/*' element={<UserRoutes />} />

            <Route
                path='/cart'
                element={
                    <MainLayout>
                        <CartPage />
                    </MainLayout>
                }
            />

             <Route path='/checkout' element={
                <MainLayout>
                    <CheckoutPage />
                </MainLayout>
                } />

            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/check-otp' element={<CheckOTP />} />
            <Route path='/reset-password' element={<ResetPassword />} />



            {/* Admin riêng */}
            <Route path='/admin/*' element={<AdminRoutes />} />
        </Routes>
    );
}
