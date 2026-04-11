import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMail, MdArrowBack, MdLockReset } from "react-icons/md";
import { toast } from 'react-toastify';
import { authApi } from '../../services/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validate định dạng email
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API yêu cầu gửi OTP quên mật khẩu
      const successMessage = await authApi.forgotPassword(email);
      
      toast.success(successMessage || "An OTP has been sent to your email.");
      
      // Chuyển sang trang Check OTP, truyền kèm email và một biến cờ (flag) 
      // để trang OTP biết đây là luồng quên mật khẩu, không phải luồng đăng ký
      navigate('/check-otp?flow=forgot', { state: { email: email } });

    } catch (errorMessage) {
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Icon */}
        <div className="pt-10 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MdLockReset className="text-4xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-8">
            Don't worry! Enter your email address and we will send you an OTP to reset your password.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-0">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* Khung hiển thị lỗi đỏ */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <MdOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input 
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg outline-none transition-all text-slate-900 dark:text-white ${errorMsg ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent'}`}
                  placeholder="name@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg(''); // Xóa lỗi khi bắt đầu gõ lại
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isLoading}
              className={`w-full text-white font-bold py-3.5 rounded-lg transition-colors shadow-md mt-4 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`} 
              type="submit"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <MdArrowBack className="text-lg" />
              Back to Login
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ForgotPassword;