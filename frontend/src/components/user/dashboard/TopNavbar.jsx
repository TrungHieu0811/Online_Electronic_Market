import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import {toast} from 'react-toastify';
// Import thêm icon Logout (tùy thư viện bạn dùng)
import {MdLogout} from 'react-icons/md';
export default function TopNavbar() {
	const navigate = useNavigate();
	const { cartCount } = useCart();
	return (
		<nav className="fixed top-0 z-50 flex max-w-full w-full items-center justify-between bg-white/80 px-8 py-4 font-['Manrope'] tracking-tight shadow-[0_12px_32px_rgba(0,26,64,0.08)] backdrop-blur-md dark:bg-slate-900/80">
			<div className="flex items-center gap-12">
				<Link to="/" className="text-2xl font-extrabold text-[#045fae] hover:opacity-80 transition-opacity">
					ElectroMart
				</Link>

				<div className="hidden items-center gap-8 md:flex">
					<Link
						to="/"
						className="text-slate-600 transition-all duration-200 hover:text-blue-600 active:scale-95 dark:text-slate-400"
					>
						Home
					</Link>
					{/* <Link
						to="/"
						className="text-slate-600 transition-all duration-200 hover:text-blue-600 active:scale-95 dark:text-slate-400"
					>
						Home
					</Link> */}

					{/* <a
						href="#"
						className="text-slate-600 transition-all duration-200 hover:text-blue-600 active:scale-95 dark:text-slate-400"
					>
						Deals
					</a> */}
				</div>
			</div>

			<div className="flex items-center gap-6">
				{/* <div className="relative hidden sm:block">
					<input
						type="text"
						placeholder="Search precision electronics..."
						className="w-64 rounded-xl border-none bg-surface-container-highest px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
					/>
				</div> */}

				<button 
    onClick={() => navigate('/cart')}
    // Thêm cursor-pointer vào đây
    className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all cursor-pointer active:scale-90"
>
    <span className="material-symbols-outlined text-[28px]">
        shopping_cart
    </span>
    
    {/* Badge hiển thị số lượng */}
    {cartCount > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm pointer-events-none">
            {cartCount > 99 ? '99+' : cartCount}
                        </span>
    )}
</button>

				{/* <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-4">
					<img
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7BECBLrIKtiPREq4JpL2V8opCQA8LZ0P4DZjb3R9X-wEG0KMDDOWMn1mYtj9EZwZKsWhgDaID_VwGqAO8i_GRyjVLd4AFRZuGM4UE1odC-AKLDeR4JFyIYPMoOXcMogEflg0367RyBoftHR9yc6EJexOxisNO5hJJuXfUK_QO1mt0RZrwB9y3N7wmLmOHmQSfhKNPJpEP4M-jTipK1WyjTcsAf9KgWrASChTtvWItLKPMDi0viI1MQhefBtvD-jDGNajazHr9QeCN"
						alt="User Avatar Profile Portrait"
						className="h-10 w-10 rounded-full object-cover"
					/>
				</div> */}
			</div>
		</nav>
	);
}
