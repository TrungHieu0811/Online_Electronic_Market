import axios from 'axios';

// Cấu hình một instance axios riêng để dùng chung token
const api = axios.create({
	baseURL: 'http://localhost:8080/api/users/orders', // Base URL cho các API liên quan đến order
});

// Tự động gắn token vào mỗi request
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const checkoutService = {
	// API xem trước phí vận chuyển
	previewShippingFee: async (districtId, wardCode, totalAmount) => {
		const response = await api.get('/preview-fee', {
			params: {districtId, wardCode, totalAmount},
		});
		console.log('shipping data: ', response.data);
		return response.data;
	},

	// API thực hiện đặt hàng (Checkout)
	placeOrder: async (orderRequest) => {
		const response = await api.post('/checkout', orderRequest);
		return response.data;
	},
};
