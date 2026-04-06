import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineMail, MdOutlineLock, MdOutlineBolt, MdLock, MdBolt } from "react-icons/md";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { FaApple } from "react-icons/fa";
// "Md" viết tắt của Material Design. "Outline" là kiểu viền nét thanh mà bạn thích.
const Login = () => {
  // State để điều khiển việc ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      {/* Login Card Container */}
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">

        {/* Top Section with Logo/Image */}
        <div className="relative h-48 w-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {/* Background Pattern/Image */}
          <div
            className="absolute inset-0 opacity-20 bg-center bg-cover"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
          ></div>

          {/* Logo Section */}
          {/* Phần Logo được bọc bởi class cha để căn giữa */}
          <div className="flex flex-col items-center">

            {/* 1. Khối màu xanh (Blue Square) */}
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg mb-3">
              {/* 2. Icon được căn giữa một cách tự nhiên nhờ flex của cha */}
              <MdBolt className="text-white text-5xl" />
            </div>

            {/* 3. Văn bản phía dưới (Text below) */}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Electro<span className="text-primary">Mart</span>
            </h1>
          </div>

          {/* Decorative Accent */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-yellow"></div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Please enter your details to sign in</p>
          </div>

          {/* Login Form */}
          <form className="space-y-5">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <MdOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                  placeholder="name@example.com"
                  type="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                {/* Link sang trang quên mật khẩu (sẽ làm sau) */}
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <MdOutlineVisibilityOff className="text-xl" />
                  ) : (
                    <MdOutlineVisibility className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" id="remember" type="checkbox" />
              <label className="text-sm text-slate-600 dark:text-slate-400" htmlFor="remember">Remember me for 30 days</label>
            </div>

            {/* Submit Button */}
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 mt-2" type="submit">
              Login to Account
              <span className="material-symbols-outlined text-lg">login</span>
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <img alt="Google" className="w-4 h-4" src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <FaApple />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Apple</span>
            </button>
          </div>

          {/* Link sang trang Register (nhớ đảm bảo UserRoutes có path="/register") */}
          <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* Accent Bottom */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">Secure 256-bit SSL Encrypted Connection</p>
        </div>
      </div>
    </div>
  );
};

export default Login;