import api from './api';

// Hàm xử lý lỗi dùng chung cho các API liên quan đến xác thực
const handleAuthError = (error) => {
	if (error.response && error.response.data) {
		const data = error.response.data;

		// 👉 THÊM MỚI: Nếu Backend trả về một chuỗi văn bản thô (VD: "OTP is incorrect")
		if (typeof data === 'string') {
			return data;
		}

		// 1. Lỗi logic nghiệp vụ (VD: IllegalArgumentException -> {"error": "Email đã tồn tại"})
		if (data.error) {
			return data.error;
		}

		// 2. Lỗi Validation form (VD: {"email": "Không hợp lệ", "phone": "Đã dùng"})
		if (typeof data === 'object' && Object.keys(data).length > 0) {
			const firstKey = Object.keys(data)[0]; // Chỉ lấy lỗi đầu tiên để hiển thị cho gọn
			return data[firstKey];
		}

		// 3. Lỗi chung có trường message
		if (data.message) {
			return data.message;
		}
	}
	return 'Error when trying to connect to the server. Please try again later.'; // Lỗi chung nếu không có thông tin chi tiết
};

export const authApi = {
	// HÀM ĐĂNG KÝ
	register: async (userData) => {
		try {
			const response = await api.post('/auth/register', userData);
			return response.data; // Trả về thông báo thành công từ backend
		} catch (error) {
			// Bắt lỗi và ném ra một chuỗi (String) thuần túy để UI dễ hiển thị
			throw handleAuthError(error);
		}
	},

	// HÀM ĐĂNG NHẬP (Chuẩn bị sẵn luôn cho trang Login)
	login: async (credentials) => {
		try {
			const response = await api.post('/auth/login', credentials);
			return response.data; // Trả về token hoặc thông tin user
		} catch (error) {
			throw handleAuthError(error);
		}
	},
	// 3. HÀM XÁC THỰC OTP (Verify Email)
	verifyEmail: async (email, otp) => {
		try {
			// Vì Spring Boot dùng @RequestParam, ta truyền null cho body và bỏ vào params
			const response = await api.post('/auth/verify-email', null, {
				params: {email: email, otp: otp},
			});
			return response.data;
		} catch (error) {
			throw handleAuthError(error);
		}
	},

	// 4. HÀM GỬI LẠI OTP (Resend OTP)
	resendOtp: async (email) => {
		try {
			const response = await api.post('/auth/resend-otp', null, {
				params: {email: email},
			});
			return response.data;
		} catch (error) {
			throw handleAuthError(error);
		}
	},
	// 1. Gửi yêu cầu quên mật khẩu (Gửi OTP)
	forgotPassword: async (email) => {
		try {
			const response = await api.post('/auth/forgot-password', null, {
				params: {email: email},
			});
			return response.data;
		} catch (error) {
			throw handleAuthError(error);
		}
	},

	// 2. Kiểm tra mã OTP (Dành riêng cho quên mật khẩu nếu Backend bạn có API riêng)
	checkOtp: async (email, otp) => {
		try {
			const response = await api.post('/auth/check-otp', null, {
				params: {email: email, otp: otp},
			});
			return response.data;
		} catch (error) {
			throw handleAuthError(error);
		}
	},

	// 3. Đặt lại mật khẩu mới
	resetPassword: async (email, otp, newPassword) => {
		try {
			const response = await api.post('/auth/reset-password', null, {
				params: {email: email, otp: otp, newPassword: newPassword},
			});
			return response.data;
		} catch (error) {
			throw handleAuthError(error);
		}
	},
};
