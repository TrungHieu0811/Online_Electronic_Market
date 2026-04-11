import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { MdLockReset, MdLockOutline, MdVerifiedUser, MdArrowForward } from "react-icons/md";
import { toast } from 'react-toastify';
import { authApi } from '../../services/authApi';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 👉 Nhận email và otp từ trang CheckOTP truyền sang
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Rào chắn bảo vệ: Nếu user tự gõ URL /reset-password mà không đi qua luồng OTP thì đá về trang Quên mật khẩu
  if (!email || !otp) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormErrors({
      ...formErrors,
      [e.target.name]: ''
    });
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.newPassword) {
      errors.newPassword = "Please enter a new password.";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long.";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match!";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 👉 Gọi API đổi mật khẩu
      const successMessage = await authApi.resetPassword(email, otp, formData.newPassword);
      
      toast.success(successMessage || "Password reset successfully! Please login.");
      
      // Thành công thì đá về trang Login
      navigate('/login');
      
    } catch (errorMessage) {
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    const baseClass = "w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition-all text-slate-900 dark:text-white ";
    if (formErrors[fieldName]) {
      return baseClass + "border-red-500 focus:ring-2 focus:ring-red-500/20";
    }
    return baseClass + "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent";
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Icon */}
        <div className="pt-10 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MdLockReset className="text-4xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create New Password
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-8">
            Your new password must be different from previous used passwords.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-0">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* New Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <MdLockOutline className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl ${formErrors.newPassword ? 'text-red-500' : 'text-slate-400'}`} />
                <input 
                  name="newPassword"
                  className={getInputClass('newPassword')}
                  placeholder="••••••••" 
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              {formErrors.newPassword && <p className="text-xs text-red-500 mt-1">{formErrors.newPassword}</p>}
            </div>

            {/* Confirm Password Input */}
            {/* Confirm Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative">
                <MdVerifiedUser className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl ${formErrors.confirmPassword ? 'text-red-500' : 'text-slate-400'}`} />
                <input 
                  name="confirmPassword"
                  className={getInputClass('confirmPassword')}
                  placeholder="••••••••" 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {formErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button 
              disabled={isLoading}
              className={`w-full h-14 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 group ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`} 
              type="submit"
            >
              <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
              {!isLoading && <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default ResetPassword;