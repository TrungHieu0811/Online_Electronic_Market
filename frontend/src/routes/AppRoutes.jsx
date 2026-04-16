import {Routes, Route} from 'react-router-dom';
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
import CategoryRoutes from './CategoryRoutes';
import NotFound from '@/components/layout/NotFound';
import AdminRoutes from './AdminRoutes';
import AdminSubRoutes from './AdminSubRoutes';
import CheckoutPage from '@/pages/user/checkout/CheckoutPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import PaymentSuccessPage from '@/pages/user/payment/PaymentSuccessPage';
import PaymentFailurePage from '@/pages/user/payment/PaymentFailurePage';


export default function AppRoutes() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<MainLayout>
						<HomePage />
					</MainLayout>
				}
			/>

			<Route
				path="/products/*"
				element={
					<MainLayout>
						<ProductRoutes />
					</MainLayout>
				}
			/>
			<Route
				path="/category/*"
				element={
					<MainLayout>
						<CategoryRoutes />
					</MainLayout>
				}
			/>
			{/* <Route
				path="/profile/*"
				element={
					<MainLayout>
						<UserRoutes />
					</MainLayout>
				}
			/> */}
			<Route
				path="/profile/*"
				element={
					<ProtectedRoute>
						<UserRoutes />
					</ProtectedRoute>
				}
			/>



			<Route
				path="/cart"
				element={
					<MainLayout>
						<CartPage />
					</MainLayout>
				}
			/>

			<Route
				path="/checkout"
				element={
					<MainLayout>
						<CheckoutPage />
					</MainLayout>
				}
			/>

			<Route
				path="/checkout/success"
				element={
					<MainLayout>
						<PaymentSuccessPage />
					</MainLayout>
				}
			/>
			<Route path="/checkout/failure" element={<MainLayout><PaymentFailurePage /></MainLayout>} />

			<Route path="/admin/*" element={<AdminRoutes />}>
				<Route path="*" element={<AdminSubRoutes />} />
			</Route>
			{/* <Route
				path="/admin/*"
				element={
					<AdminRoute>
						<AdminRoutes />
					</AdminRoute>
				}
			/> */}

			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/check-otp" element={<CheckOTP />} />
			<Route path="/reset-password" element={<ResetPassword />} />
			{/* Route cho trang 404 cụ thể */}
			<Route
				path="/404"
				element={
					<MainLayout>
						<NotFound />
					</MainLayout>
				}
			/>
			{/* Route bắt tất cả các đường dẫn sai khác không khai báo */}
			<Route
				path="*"
				element={
					<MainLayout>
						<NotFound />
					</MainLayout>
				}
			/>
		</Routes>
	);
}
