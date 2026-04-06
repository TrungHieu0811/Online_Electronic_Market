import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  MdLockOutline, 
  MdOutlineVisibility, 
  MdOutlineVisibilityOff, 
  MdPassword, 
  MdCheckCircleOutline 
} from "react-icons/md";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy email từ các bước trước truyền sang (rất quan trọng cho DTO)
  const email = location.state?.email || "email_cua_ban@example.com";

  // State quản lý form và ẩn/hiện mật khẩu
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate cơ bản trước khi gọi API
    if (newPassword !== confirmPassword) {
      alert("The verification password does not match. Please check again!");
      return;
    }
    
    if (newPassword.length < 6) {
      alert("The password must be at least 6 characters long!");
      return;
    }

    // Gói DTO chuẩn bị gửi cho Spring Boot
    const resetPasswordDTO = {
      email: email,
      newPassword: newPassword
    };

    console.log("Sending DTO to reset password:", resetPasswordDTO);
    
    // Giả lập thành công: Thông báo và đẩy về trang Login
    alert("Password reset successfully! Please log in again.");
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MdPassword className="text-4xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create New Password
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-6">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Tên tài khoản (Chỉ đọc) */}
            <div className="text-center mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account being restored:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{email}</p>
            </div>

            {/* New Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MdLockOutline className="text-lg text-slate-400" />
                New Password
              </label>
              <div className="relative">
                <input 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white" 
                  placeholder="Enter at least 6 characters" 
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <MdOutlineVisibilityOff className="text-xl" /> : <MdOutlineVisibility className="text-xl" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MdCheckCircleOutline className="text-lg text-slate-400" />
                Confirm new password
              </label>
              <div className="relative">
                <input 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white" 
                  placeholder="Enter new password again" 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <MdOutlineVisibilityOff className="text-xl" /> : <MdOutlineVisibility className="text-xl" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md mt-4" 
              type="submit"
            >
              Save New Password
            </button>
          </form>

          {/* Cancel Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel and return to Login
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ResetPassword;