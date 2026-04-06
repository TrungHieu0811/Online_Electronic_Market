import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdVerifiedUser } from "react-icons/md";

const CheckOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy email từ trang trước truyền sang (nếu có), nếu không có thì để trống
  const email = location.state?.email || "email_cua_ban@example.com";

  // Mảng lưu 6 số OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // Dùng useRef để điều khiển việc focus vào các ô input
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo nếu đã nhập và chưa phải ô cuối cùng
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Xử lý khi bấm nút Backspace (Xóa)
    if (e.key === 'Backspace') {
      if (index > 0 && otp[index] === '') {
        // Nếu ô hiện tại rỗng và bấm xóa, lùi về ô trước đó
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    // Yêu cầu phải nhập đủ 6 số
    if (otpValue.length < 6) {
      alert("Please enter the complete 6-digit OTP.");
      return;
    }

    // Ở đây sau này bạn sẽ gói DTO (email + otpValue) gửi xuống Spring Boot
    console.log("Verifying OTP:", { email: email, otp: otpValue });
    
    // Giả lập: Nếu mã đúng, chuyển sang trang Reset Password
    // navigate('/reset-password', { state: { email: email } });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      {/* Card Container */}
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
            The 6-digit verification code has been sent to <br />
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
                  // Gắn từng ô input vào mảng refs
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                />
              ))}
            </div>

            {/* Resend Code */}
            <div className="text-center text-sm">
              <span className="text-slate-500 dark:text-slate-400"> Haven't received the code? </span>
              <button type="button" className="font-bold text-primary hover:underline">
                Resend now
              </button>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md mt-2" 
              type="submit"
            >
              Verify OTP
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link 
              to="/forgot-password" 
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