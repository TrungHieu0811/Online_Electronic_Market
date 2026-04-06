import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMail, MdArrowBack, MdLockReset } from "react-icons/md";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // Hàm xử lý khi bấm nút "Gửi mã OTP"
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ở đây sau này bạn sẽ gọi API gửi DTO xuống Spring Boot
    console.log("Sending DTO containing email:", email);
    
    // Giả lập: Chuyển sang trang Check OTP sau khi gửi thành công
    // Mình có thể truyền luôn email sang trang OTP để không bắt người dùng nhập lại
    // navigate('/check-otp', { state: { email: email } });
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
            Forget Password?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-8">
            Don't worry! Just enter your email and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <MdOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white" 
                  placeholder="name@example.com" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md mt-4" 
              type="submit"
            >
              Send OTP confirmation code
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <MdArrowBack className="text-lg" />
              Return to the Login page
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ForgotPassword;