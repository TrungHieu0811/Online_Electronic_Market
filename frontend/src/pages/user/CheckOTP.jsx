import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdVerifiedUser } from "react-icons/md";
import { toast } from 'react-toastify';
import { authApi } from '../../services/authApi';

const CheckOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your_email@example.com";
  
  // Lấy chữ flow=... trực tiếp từ thanh địa chỉ URL
  const searchParams = new URLSearchParams(location.search);
  const isForgotPasswordFlow = searchParams.get('flow') === 'forgot';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  // Hàm xử lý khi gõ từng ô số
  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Hàm xử lý khi bấm Backspace để lùi ô
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (index > 0 && otp[index] === '') {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Hàm Xử lý Xác nhận OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    // 👉 ĐÃ FIX LỖI ALERT: Thay bằng toast.warning
    if (otpValue.length < 6) {
      toast.warning("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsLoading(true);

    try {
      if (isForgotPasswordFlow) {
        // Luồng QUÊN MẬT KHẨU: Check OTP xong thì chuyển sang trang Reset Password
        const successMessage = await authApi.checkOtp(email, otpValue);
        toast.success(successMessage || "OTP verified successfully! Please set a new password.");
        navigate('/reset-password', { state: { email: email, otp: otpValue } });
      } else {
        // Luồng ĐĂNG KÝ: Verify Email xong thì chuyển về Login
        const successMessage = await authApi.verifyEmail(email, otpValue);
        toast.success(successMessage || "Account verified successfully!");
        navigate('/login');
      }
    } catch (errorMessage) {
      // Bắt lỗi hiển thị Toast đỏ
      toast.error(errorMessage);
      
      // Tự động xóa sạch 6 ô để người dùng nhập lại
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus(); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm Xử lý Gửi lại mã
  const handleResendOtp = async () => {
    toast.info("Resending OTP...");
    try {
      // Dùng chung hàm resend hoặc forgot tùy vào luồng
      const message = isForgotPasswordFlow 
          ? await authApi.forgotPassword(email) 
          : await authApi.resendOtp(email);
          
      toast.success(message || "OTP has been resent. Please check your email.");
    } catch (errorMessage) {
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MdVerifiedUser className="text-4xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verify OTP
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-6">
            A 6-digit verification code has been sent to <br />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
          </p>
        </div>

        {/* OTP Form */}
        <div className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 6 OTP Inputs */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                />
              ))}
            </div>

            {/* Resend Code */}
            <div className="text-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">Didn't receive the code? </span>
              <button 
                type="button" 
                onClick={handleResendOtp}
                className="font-bold text-primary hover:underline"
              >
                Resend now
              </button>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isLoading}
              className={`w-full text-white font-bold py-3.5 rounded-lg transition-colors shadow-md mt-2 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`} 
              type="submit"
            >
              {isLoading ? 'Verifying...' : 'Confirm OTP'}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link 
              to={isForgotPasswordFlow ? "/forgot-password" : "/register"} 
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <MdArrowBack className="text-lg" />
              Back
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default CheckOTP;