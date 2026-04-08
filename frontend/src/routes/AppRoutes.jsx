import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import CartPage from '../pages/user/cart/CartPage';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/profile/*' element={<UserRoutes />} />
            <Route path='/cart' element={<CartPage />} />
        </Routes>
    );
}
