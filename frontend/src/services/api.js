import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8080/api', // Đảm bảo port này đúng với Spring Boot của bạn
	headers: {
		'Content-Type': 'application/json',
	},
});

// =========================================================================
// 1. REQUEST INTERCEPTOR: Tự động nhét Token vào mọi API trước khi gửi đi
// =========================================================================
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// =========================================================================
// 2. RESPONSE INTERCEPTOR: Bắt lỗi 401/403 để tự động Refresh Token
// 👉 ĐÂY CHÍNH LÀ PHẦN BẠN ĐANG THIẾU!
// =========================================================================
api.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
			originalRequest._retry = true;

			const refreshToken = localStorage.getItem('refreshToken');

			// 👉 FIX VẤN ĐỀ 1 Ở ĐÂY: Nếu là KHÁCH VÃNG LAI (Không có refresh token)
			// Thì KHÔNG đá văng ra trang Login. Cứ ném lỗi ra để Component tự xử lý (VD: Giỏ hàng hiện 0).
			if (!refreshToken) {
				return Promise.reject(error);
			}

			try {
				// ... (Phần xin cấp lại token mới bằng axios.post giữ nguyên không đổi) ...
				const res = await axios.post('http://localhost:8080/api/auth/refresh', {
					refreshToken: refreshToken,
				});

				const newAccessToken = res.data.accessToken;
				const newRefreshToken = res.data.refreshToken;
				localStorage.setItem('token', newAccessToken);
				if (newRefreshToken) {
					localStorage.setItem('refreshToken', newRefreshToken);
				}
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				// ĐÂY MỚI LÀ CHỖ ĐÁ VĂNG: Chỉ khi nào CÓ token nhưng token đó HẾT HẠN THẬT SỰ
				console.log('Refresh Token failed! Đăng xuất người dùng.');
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
				window.location.href = '/login';
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	},
);

export default api;
