import {Routes, Route} from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import CartPage from '../pages/user/cart/CartPage';
import ProductRoutes from './ProductRoutes';
import ScrollToTop from '@/components/layout/ScrollToTop';
import Login from '../pages/user/Login.jsx';
import Register from '@/pages/user/Register';
import ForgotPassword from '../pages/user/ForgotPassword';
import CheckOTP from '../pages/user/CheckOTP';
import ResetPassword from '../pages/user/ResetPassword';


export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/products/*" element={<ProductRoutes />} />
			<Route path="/profile/*" element={<UserRoutes />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/check-otp" element={<CheckOTP />} />
			<Route path="/reset-password" element={<ResetPassword />} />
      <Route path='/cart' element={<CartPage />} />
		</Routes>
	);
}
