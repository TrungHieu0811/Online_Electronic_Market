import React from 'react';
import {NavLink} from 'react-router-dom';
import {Link, useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
// Import thêm icon Logout (tùy thư viện bạn dùng)
import {MdLogout} from 'react-icons/md';

export default function Sidebar() {
	const navigate = useNavigate();
	const handleLogout = () => {
		// 1. Xóa sạch két sắt
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');

		// 2. Hiện thông báo
		toast.info('You have logged out.');

		// 3. Đẩy về trang chủ và load lại trang để reset state
		navigate('/');
		window.location.reload();
	};
	const baseClass =
		'flex items-center gap-3 rounded-l-lg px-4 py-3 transition-transform hover:translate-x-1 active:opacity-80';

	const inactiveClass = 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800';

	const activeClass = 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400';

	return (
		<aside className="fixed left-0 top-16 flex h-screen w-64 flex-col space-y-2 bg-slate-50 py-6 pl-4 font-['Inter'] text-sm font-medium dark:bg-slate-950">
			{/* <div className="mb-8 px-4">
				<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Account Tier</p>
				<h3 className="font-bold text-blue-700 dark:text-blue-400">Premium Member</h3>
				<p className="text-xs text-on-surface-variant/70">Precision Ledger</p>
			</div> */}

			<nav className="flex-1 space-y-1">
				<NavLink to="/profile" end className={({isActive}) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}>
					<span className="material-symbols-outlined">dashboard</span>
					<span>Dashboard</span>
				</NavLink>

				<NavLink to="/profile/orders" className={({isActive}) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}>
					<span className="material-symbols-outlined">package</span>
					<span>Orders</span>
				</NavLink>

				{/* <NavLink
					to="/profile/wishlist"
					className={({isActive}) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
				>
					<span className="material-symbols-outlined">favorite</span>
					<span>Wishlist</span>
				</NavLink>

				<NavLink
					to="/profile/settings"
					className={({isActive}) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
				>
					<span className="material-symbols-outlined">settings</span>
					<span>Settings</span>
				</NavLink> */}
				{/* 👉 THÊM NÚT LOGOUT VÀO ĐÂY */}
				<button
					onClick={handleLogout}
					className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-2"
				>
					<MdLogout className="h-5 w-5" />
					<span className="font-medium">Logout</span>
				</button>
			</nav>
		</aside>
	);
}
