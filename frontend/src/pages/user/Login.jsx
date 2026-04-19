import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { authApi } from '../../services/authApi';
import { MdBolt, MdShoppingCart, MdOutlineMail, MdLockOutline, MdArrowForward, MdStar, MdLogin } from 'react-icons/md';
import { cartService } from '../../services/cartService';
import { useCart } from '../../context/CartContext';
import Header from '@/components/layout/Header';
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from '@react-oauth/google';
const Login = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	// 👉 Hàm xử lý khi Google trả về kết quả thành công
    const handleGoogleSuccess = async (credentialResponse) => {
        const googleToken = credentialResponse.credential;
        console.log("=== ĐÃ LẤY ĐƯỢC TOKEN TỪ GOOGLE ===");
        
        try {
            // Hiển thị loading (nếu bạn có state isLoading)
            setIsLoading(true);

            // GỌI API NÉM TOKEN XUỐNG SPRING BOOT
            // Sửa lại đường dẫn API cho đúng với cấu hình của bạn nhé
            const response = await authApi.googleLogin({ token: googleToken }); 
            // Hoặc nếu dùng axios thuần: await axios.post('http://localhost:8080/api/auth/google-login', { token: googleToken });

            // Lấy token nội bộ của hệ thống từ Backend trả về
            const accessToken = response.token || response.data?.token;
            const refreshToken = response.refreshToken || response.data?.refreshToken;

            if (accessToken) {
                // 1. Lưu vào LocalStorage
                localStorage.setItem('token', accessToken);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

                // 2. Gộp Giỏ hàng (Merge Cart) - Bê nguyên logic cũ của bạn xuống đây
                try {
                    const localCart = JSON.parse(localStorage.getItem('guestCart')) || [];
                    if (localCart.length > 0) {
                        const dataToMerge = localCart.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                imageUrl: item.product?.imageList?.[0]?.imageUrl || item.imageUrl 
                        }));
                        await cartService.mergeCart(dataToMerge);
                        localStorage.removeItem('guestCart');
                    }
                    await fetchCartCount();
                } catch (mergeError) {
                    console.error('Error merging cart:', mergeError);
                }

                toast.success('Login successful!');
                
                // 3. Chuyển hướng về trang chủ
                navigate(location.state?.from || '/');
            }
        } catch (error) {
            console.error("Error validating Backend:", error);
            toast.error("Login failed due to Server Error!");
        } finally {
            setIsLoading(false);
        }
    };
	const { fetchCartCount } = useCart();

	const handleSubmit = async (e) => {
		const originPath = location.state?.from || '/';
		e.preventDefault();

		// Validate cơ bản ở Frontend
		if (!formData.username.trim() || !formData.password) {
			toast.warning('Please enter both username/email and password!');
			return;
		}

		setIsLoading(true);

		try {
			const response = await authApi.login(formData);

			let token = null;
			let refreshToken = null; // 👉 Bổ sung biến chứa Refresh Token

			if (typeof response === 'string') {
				token = response;
			} else if (typeof response === 'object' && response !== null) {
				// Lấy Access Token
				token = response.token || response.accessToken || response.access_token || response.jwt;

				// 👉 Lấy Refresh Token (Bắt các trường hợp tên biến Backend có thể trả về)
				refreshToken = response.refreshToken || response.refresh_token;
			}

			if (token) {
				// Lưu Access Token
				localStorage.setItem('token', token);

				// 👉 Lưu Refresh Token (Nếu Backend có trả về)
				if (refreshToken) {
					localStorage.setItem('refreshToken', refreshToken);
				}

				//Merge cart sau khi login
				try {
					// 1. Lấy dữ liệu giỏ hàng tạm thời từ localStorage
					const localCart = JSON.parse(localStorage.getItem('guestCart')) || [];

					// 2. Nếu có hàng trong giỏ tạm, tiến hành gọi API merge
					if (localCart.length > 0) {

						const dataToMerge = localCart.map(item => ({
								productId: item.productId,
								quantity: item.quantity,
								// Lấy ảnh đầu tiên từ imageList của Guest để gửi lên
								imageUrl: item.product?.imageList?.[0]?.imageUrl || item.imageUrl 
						}));

						console.log("Dữ liệu gửi lên Backend để gộp nè:", dataToMerge);
						await cartService.mergeCart(dataToMerge);
						// await cartService.mergeCart(localCart);
						console.log('Cart merged successfully!');
						// 3. Xóa giỏ hàng tạm sau khi đã gộp thành công vào Database
						localStorage.removeItem('guestCart');
						await fetchCartCount();
					} else {
						await fetchCartCount();
					}
				} catch (mergeError) {
					// Chỉ log lỗi merge để không làm gián đoạn quá trình login chính
					console.error('Failed to merge cart:', mergeError);
				}

				toast.success('Login successful!');



				// =========================================================
				// 👉 2. GIẢI MÃ TOKEN ĐỂ KIỂM TRA ROLE VÀ CHUYỂN TRANG
				// =========================================================
				try {
					const decodedToken = jwtDecode(token);

					// In ra console để bạn xem Spring Boot đang giấu Role ở biến nào
					console.log("Thông tin Token:", decodedToken);

					// Lấy mảng Role ra (Spring Boot thường lưu trong 'roles', 'role', hoặc 'authorities')
					// Nếu backend của bạn lưu kiểu khác, hãy nhìn vào màn hình Console (F12) để đổi tên biến cho đúng nhé!
					let userRoles = decodedToken.roles || decodedToken.role || decodedToken.authorities || [];

					// Ép kiểu về mảng nếu Backend trả về chuỗi đơn (VD: "ADMIN")
					if (typeof userRoles === 'string') {
						userRoles = [userRoles];
					}

					// Chuẩn hóa tên Role (Viết hoa hết) để so sánh cho dễ
					// Xử lý luôn trường hợp Spring Boot trả về dạng object [{authority: "ROLE_ADMIN"}]
					const roleStrings = userRoles.map(r =>
						typeof r === 'string' ? r.toUpperCase() : (r.authority || '').toUpperCase()
					);

					// Kiểm tra xem có quyền Admin/Superadmin không
					const isAdmin = roleStrings.includes('ADMIN') ||
						roleStrings.includes('ROLE_STAFF') ||
						roleStrings.includes('SUPERADMIN') ||
						roleStrings.includes('ROLE_SUPERADMIN');


					if (isAdmin) {
						if (formData.password === '123') {
							toast.warning("This is your first login. Please change your password to continue!");

							// Chuyển hướng thẳng sang trang Đổi mật khẩu
							navigate('/admin/change-password'); // Sửa lại đường dẫn này cho khớp với Route của bạn
						} else {
							// toast.success("Login successful!");
							// Đăng nhập bình thường thì vào Dashboard
							navigate('/admin');
						}
					} else {
						navigate(originPath, { replace: true });     // Trả về trang User (Trang chủ)
					}

				} catch (decodeError) {
					console.error("Lỗi giải mã token:", decodeError);
					navigate('/'); // Fallback an toàn nếu lỗi
				}



			} else {
				toast.warning('Login successful, but failed to retrieve token!');
				console.log('Server Response:', response);
			}
		} catch (errorMessage) {
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
			{/* Navigation Header
			<header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
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
			</header> */}
			<Header></Header>

			{/* Main Content: Login Card */}
			<main className="flex-grow flex items-center justify-center p-4 md:p-8">
				<div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
					{/* Card Header */}
					<div className="p-8 pb-0">
						<div className="flex items-center gap-2 text-primary mb-2">
							<MdLogin className="text-lg" />
							<span className="text-xs font-bold uppercase tracking-wider">Welcome back</span>
						</div>
						<h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Login</h2>
						<p className="text-slate-500 dark:text-slate-400">Log in to access exclusive deals and manage your orders.</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="p-8 space-y-5">
						{/* Username/Email Field */}
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<MdOutlineMail className="text-lg text-slate-400" />
								Username
							</label>
							<input
								name="username"
								value={formData.username}
								onChange={handleChange}
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="Enter your username"
								type="text"
							/>
						</div>

						{/* Password Field */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
									<MdLockOutline className="text-lg text-slate-400" />
									Password
								</label>
								<Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
									Forgot Password?
								</Link>
							</div>
							<input
								name="password"
								value={formData.password}
								onChange={handleChange}
								className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
								placeholder="••••••••"
								type="password"
							/>
						</div>

						{/* Login Button */}
						<button
							disabled={isLoading}
							className={`w-full h-14 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 group ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
							type="submit"
						>
							<span>{isLoading ? 'Authenticating...' : 'Login'}</span>
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

						{/* Social Login */}
                        <div className="flex justify-center mt-2">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    toast.error('Login Failed!');
                                    console.error('Login Failed');
                                }}
                                // Các thuộc tính giúp nút Google bo góc đẹp và vừa vặn với giao diện của bạn
                                shape="rectangular" 
                                size="large"
                                theme="outline"
                                text="signin_with"
                                useOneTap 
                            />
                        </div>
					</form>

					{/* Footer Link */}
					<div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-200 dark:border-slate-800">
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Don't have an account?
							<Link to="/register" className="text-accent-blue font-bold hover:underline ml-1">
								Register now
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

export default Login;
