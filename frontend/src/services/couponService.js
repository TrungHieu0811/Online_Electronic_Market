import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/admin';

const getHeaders = () => ({
	headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
});

export const couponService = {
	//ADMIN
	// Lấy tất cả coupon
	getCoupons: () => axios.get(`${API_BASE}/coupons`, getHeaders()),

	// Tạo mới coupon
	createCoupon: (data) => axios.post(`${API_BASE}/coupons`, data, getHeaders()),

	// Lấy lịch sử khách hàng đã sử dụng
	getUsageHistory: () => axios.get(`${API_BASE}/coupons-history`, getHeaders()),

	// Lấy nhật ký thay đổi của Admin
	getAdminLogs: () => axios.get(`${API_BASE}/coupon-logs`, getHeaders()),

	updateCoupon: (id, data, adminId) => {
		return axios.put(`${API_BASE}/coupons/${id}?adminId=${adminId}`, data, getHeaders());
	},
	//USER
	getAvailableCoupons: (orderValue) => axios.get(`${API_USER}/available?orderValue=${orderValue}`, getHeaders()),

	/**
	 * Kiểm tra nhanh một mã coupon cụ thể
	 */
	validateCoupon: (code, orderValue) =>
		axios.get(`${API_USER}/validate?code=${code}&orderValue=${orderValue}`, getHeaders()),

	/**
	 * Hoàn trả lại lượt dùng coupon nếu đơn hàng/thanh toán thất bại
	 */
	rollbackCoupon: (code) => axios.post(`${API_USER}/rollback?code=${code}`, {}, getHeaders()),
};
