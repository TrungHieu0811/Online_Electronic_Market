import React from 'react';
import {FaApple} from 'react-icons/fa';
import {FcGoogle} from 'react-icons/fc';
import {authApi} from '../../services/authApi';
import {useState} from 'react'; // 👉 Đảm bảo import useState
import {Link, useNavigate} from 'react-router-dom'; // 👉 Đảm bảo import useNavigate
import {toast} from 'react-toastify';
// 👉 Import toàn bộ icon từ react-icons/md (Material Design)
import {
	MdBolt,
	MdShoppingCart,
	MdPersonAdd,
	MdBadge,
	MdOutlineMail,
	MdCall,
	MdLockOutline,
	MdVerifiedUser,
	MdArrowForward,
	MdStar,
	MdAccountCircle, // 👉 Thêm icon này cho ô Username
} from 'react-icons/md';

const Register = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState(''); // State để lưu thông báo lỗi đỏ

	// 👉 1. State mới để chứa lỗi của TỪNG ô input riêng biệt
	const [formErrors, setFormErrors] = useState({});

	// 👉 2. Hàm kiểm tra lỗi cục bộ trước khi gửi API
	const validateForm = () => {
		let errors = {};

		if (!formData.fullName.trim()) errors.fullName = 'Please enter your full name.';
		if (!formData.username.trim()) errors.username = 'Please enter a username.';

		if (!formData.email.trim()) {
			errors.email = 'Please enter your email.';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			errors.email = 'Email is not in a valid format.';
		}

		if (!formData.phone.trim()) {
			errors.phone = 'Please enter your phone number.';
		} else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
			errors.phone = 'Phone number is not valid (10-11 digits).';
		}

		if (!formData.password) {
			errors.password = 'Please enter a password.';
		} else if (formData.password.length < 6) {
			errors.password = 'Password must be at least 6 characters long.';
		}

		if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = 'Password confirmation does not match.';
		}

		return errors;
	};

	// 👉 1. Khai báo state cho tất cả các ô input
	const [formData, setFormData] = useState({
		fullName: '',
		username: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: '',
	});

	// Hàm xử lý khi gõ vào ô input
	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		// 👉 Xóa lỗi của ô hiện tại khi người dùng bắt đầu gõ lại
		setFormErrors({
			...formErrors,
			[e.target.name]: '',
		});
		setErrorMsg(''); // Xóa lỗi đi khi người dùng bắt đầu sửa lại
	};

	// 👉 2. Hàm xử lý khi bấm nút Register
	const handleSubmit = async (e) => {
		e.preventDefault();

		// 👉 3. Chạy hàm kiểm tra lỗi trước
		const validationErrors = validateForm();

		if (Object.keys(validationErrors).length > 0) {
			setFormErrors(validationErrors);
			return;
		}

		// Kiểm tra mật khẩu khớp nhau ở Frontend trước cho lẹ
		if (formData.password !== formData.confirmPassword) {
			setErrorMsg('Password confirmation does not match!');
			return;
		}

		setIsLoading(true);
		setErrorMsg('');

		try {
			// Gọi API từ authApi.js
			const successMessage = await authApi.register(formData);

			// Nếu thành công -> Thông báo và chuyển trang

			let finalMessage = 'Registration successful! Please check your email to get the OTP.';
			// Nếu Backend trả về dạng chuỗi thì lấy luôn
			if (typeof successMessage === 'string') {
				finalMessage = successMessage;
			}
			// Nếu Backend trả về dạng Object thì moi cái 'message' ra
			else if (typeof successMessage === 'object' && successMessage !== null) {
				finalMessage = successMessage.message || successMessage.data || finalMessage;
			}

			// XÓA cái alert() cũ đi và thay bằng:
			toast.success(finalMessage);

			// Chuyển sang trang CheckOTP, truyền theo email để bên đó dùng
			// Ghim thẳng chữ ?flow=register lên URL
			navigate('/check-otp?flow=register', {state: {email: formData.email}});
		} catch (errorMessage) {
			// Nếu thất bại -> Hiển thị lỗi từ Backend lên (ví dụ: "Email đã tồn tại")
			setErrorMsg(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};
	// 👉 Hàm hỗ trợ đổi màu viền input nếu có lỗi
	const getInputClass = (fieldName) => {
		const baseClass =
			'w-full h-12 px-4 rounded-xl border outline-none transition-all text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 ';
		if (formErrors[fieldName]) {
			return baseClass + 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500';
		}
		return baseClass + 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary';
	};
	return (
		<div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
			{/* Navigation Header */}
			<header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{/* 👉 Sửa Logo: Flex center để căn giữa icon */}
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
							<MdBolt className="text-white text-2xl" />
						</div>
						<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">ElectroMart</h1>
					</div>
					<div className="flex items-center gap-4">
						<button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
							<MdShoppingCart className="text-xl" />
						</button>
					</div>
				</div>
			</header>

			{/* Main Content: Registration Card */}
			<main className="flex-grow flex items-center justify-center p-4 md:p-8">
				<div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
					{/* Card Header */}
					<div className="p-8 pb-0">
						<div className="flex items-center gap-2 text-accent-blue mb-2">
							<MdPersonAdd className="text-lg" />
							<span className="text-xs font-bold uppercase tracking-wider">Join our community</span>
						</div>
						<h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Create Account</h2>
						<p className="text-slate-500 dark:text-slate-400">
							Join ElectroMart today for exclusive deals and faster checkout.
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} noValidate className="p-8 space-y-5">
						{/* 👉 Khung hiển thị thông báo lỗi (Màu đỏ) */}
						{errorMsg && (
							<div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg">{errorMsg}</div>
						)}

						{/* Full Name Field */}
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<MdBadge className="text-lg text-slate-400" />
								Full Name
							</label>
							<input
								name="fullName" // 👉 Thêm name
								value={formData.fullName} // 👉 Liên kết value
								onChange={handleChange} // 👉 Liên kết hàm thay đổi
								required
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="John Doe"
								type="text"
							/>
							{/* 👉 5. Hiển thị dòng text lỗi đỏ ở dưới ô input */}
							{formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
						</div>

						{/* 👉 THÊM MỚI: Username Field (Bắt buộc cho backend) */}
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<MdAccountCircle className="text-lg text-slate-400" />
								Username
							</label>
							<input
								name="username"
								value={formData.username}
								onChange={handleChange}
								required
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="johndoe123"
								type="text"
							/>
							{formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
						</div>

						{/* Email Field */}
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<MdOutlineMail className="text-lg text-slate-400" />
								Email Address
							</label>
							<input
								name="email" // 👉 Thêm name
								value={formData.email} // 👉 Liên kết value
								onChange={handleChange} // 👉 Liên kết hàm thay đổi
								required
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="john@example.com"
								type="email"
							/>
							{formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
						</div>

						{/* Phone Field */}
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<MdCall className="text-lg text-slate-400" />
								Phone Number
							</label>
							<input
								name="phone" // 👉 Thêm name
								value={formData.phone} // 👉 Liên kết value
								onChange={handleChange} // 👉 Liên kết hàm thay đổi
								required
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="0900123456"
								type="tel"
							/>
							{formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
						</div>

						{/* Password Row */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
									<MdLockOutline className="text-lg text-slate-400" />
									Password
								</label>
								<input
									name="password" // 👉 Thêm name
									value={formData.password} // 👉 Liên kết value
									onChange={handleChange} // 👉 Liên kết hàm thay đổi
									required
									className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
									placeholder="••••••••"
									type="password"
								/>
								{formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
							</div>
							<div className="space-y-2">
								<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
									<MdVerifiedUser className="text-lg text-slate-400" />
									Confirm
								</label>
								<input
									name="confirmPassword" // 👉 Thêm name
									value={formData.confirmPassword} // 👉 Liên kết value
									onChange={handleChange} // 👉 Liên kết hàm thay đổi
									required
									className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
									placeholder="••••••••"
									type="password"
								/>
								{formErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>}
							</div>
						</div>

						{/* Register Button */}
						<button
							disabled={isLoading} // 👉 Khóa nút khi đang load
							className={`w-full h-14 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 group ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
							type="submit"
						>
							<span>{isLoading ? 'Processing...' : 'Register Account'}</span>
							{!isLoading && <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />}
						</button>

						{/* Divider */}
						<div className="relative py-4">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or continue with</span>
							</div>
						</div>

						{/* Social Register */}
						<div className="grid grid-cols-2 gap-4">
							<button
								className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
								type="button"
							>
								<div className="w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center">
									<FcGoogle />
								</div>
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
							</button>
							<button
								className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
								type="button"
							>
								<FaApple />
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Apple</span>
							</button>
						</div>
					</form>

					{/* Footer Link */}
					<div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-200 dark:border-slate-800">
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Already have an account?
							<Link to="/login" className="text-accent-blue font-bold hover:underline ml-1">
								Login
							</Link>
						</p>
					</div>
				</div>
			</main>

			{/* Simple Footer */}
			<footer className="py-8 text-center border-t border-slate-200 dark:border-slate-800 mt-auto">
				<div className="flex items-center justify-center gap-6 mb-4">
					<span className="text-accent-yellow flex items-center">
						<MdStar className="text-lg" />
					</span>
					<span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Trusted by 50k+ Customers</span>
					<span className="text-accent-yellow flex items-center">
						<MdStar className="text-lg" />
					</span>
				</div>
				<p className="text-xs text-slate-400">© 2026 ElectroMart Inc. All rights reserved.</p>
			</footer>
		</div>
	);
};

export default Register;
