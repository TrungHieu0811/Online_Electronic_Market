import {Routes, Route, Navigate, Outlet} from 'react-router-dom';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import CategoryCreatePage from '@/pages/admin/category/AdminCategoryCreatePage';
import CategoryPage from '@/pages/admin/category/AdminCategoryPage';
import TestCateConfigManagementPage from '@/pages/admin/category/TestCateConfigManagementPage';
import UserManagementPage from '@/components/admin/UserManagement';
import CouponManagementPage from '@/pages/admin/CouponManagementPage';

import {jwtDecode} from 'jwt-decode';
export default function AdminRoutes() {
	const token = localStorage.getItem('token');

	// Nếu không có token, đá về trang chủ ngay
	if (!token) return <Navigate to="/" replace />;

	try {
		// Giải mã Token lấy dữ liệu từ Backend gửi qua
		const decoded = jwtDecode(token);

		// Theo code Java của bạn: claims.put("role", user.getUserRole().name())
		const userRole = decoded.role;

		// Kiểm tra thời gian hết hạn (decoded.exp tính bằng giây)
		const isExpired = decoded.exp * 1000 < Date.now();

		const isAdmin = userRole === 'ROLE_SUPERADMIN' || userRole === 'ROLE_STAFF';

		if (isExpired || !isAdmin) {
			// Nếu hết hạn hoặc sai quyền, dọn dẹp và đẩy ra ngoài
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			return <Navigate to="/" replace />;
		}

		// Hợp lệ thì cho vào trang Admin
		return <Outlet />;
	} catch (error) {
		// Token lỗi định dạng (không phải JWT hợp lệ)
		console.error('JWT Decode Error:', error);
		localStorage.clear();
		return <Navigate to="/" replace />;
	}

	// return (
	// 	<Routes>
	// 		<Route index element={<Navigate to="dashboard" replace />} />
	// 		<Route path="dashboard" element={<AdminDashboardPage />} />
	// 		<Route path="users" element={<UserManagementPage />} />
	// 		<Route path="coupons" element={<CouponManagementPage />} />
	// 	</Routes>
	// );
}
