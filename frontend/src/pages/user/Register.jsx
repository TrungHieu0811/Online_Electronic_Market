import React from 'react';
import { Link } from 'react-router-dom';
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc"; 
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
  MdStar
} from "react-icons/md";

const Register = () => {
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
            <p className="text-slate-500 dark:text-slate-400">Join ElectroMart today for exclusive deals and faster checkout.</p>
          </div>

          {/* Form */}
          <form className="p-8 space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MdBadge className="text-lg text-slate-400" />
                Full Name
              </label>
              <input 
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                placeholder="John Doe" 
                type="text" 
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MdOutlineMail className="text-lg text-slate-400" />
                Email Address
              </label>
              <input 
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                placeholder="john@example.com" 
                type="email" 
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MdCall className="text-lg text-slate-400" />
                Phone Number
              </label>
              <input 
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                placeholder="+1 (555) 000-0000" 
                type="tel" 
              />
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MdLockOutline className="text-lg text-slate-400" />
                  Password
                </label>
                <input 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="••••••••" 
                  type="password" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MdVerifiedUser className="text-lg text-slate-400" />
                  Confirm
                </label>
                <input 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="••••••••" 
                  type="password" 
                />
              </div>
            </div>

            {/* Register Button */}
            <button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 group" type="submit">
              <span>Register Account</span>
              <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
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
              <button className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" type="button">
                <div className="w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center">
                  <FcGoogle />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
              </button>
              <button className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" type="button">
                <FaApple />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Apple</span>
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account? 
              <Link to="/login" className="text-accent-blue font-bold hover:underline ml-1">Login</Link>
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