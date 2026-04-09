import {Routes, Route} from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import ProductRoutes from './ProductRoutes';
import ScrollToTop from '@/components/layout/ScrollToTop';
import Login from '../pages/user/Login.jsx';
import Register from '@/pages/user/Register';
import ForgotPassword from '../pages/user/ForgotPassword';
import CheckOTP from '../pages/user/CheckOTP';
import ResetPassword from '../pages/user/ResetPassword';
import CategoryRoutes from './CategoryRoutes';
import NotFound from '@/components/layout/NotFound';

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/products/*" element={<ProductRoutes />} />
			<Route path="/category/*" element={<CategoryRoutes />} />
			<Route path="/profile/*" element={<UserRoutes />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/check-otp" element={<CheckOTP />} />
			<Route path="/reset-password" element={<ResetPassword />} />

			{/* Route cho trang 404 cụ thể */}
			<Route path="/404" element={<NotFound />} />
			{/* Route bắt tất cả các đường dẫn sai khác không khai báo */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
