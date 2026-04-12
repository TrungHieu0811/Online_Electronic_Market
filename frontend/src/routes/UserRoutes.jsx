import React from 'react';
import {Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom';

import UserDashboardPage from '@/features/user/profile/pages/user/UserDashboardPage';
import RateOrderPage from '@/features/user/profile/pages/RateOrderPage';
import OrdersPage from '@/features/user/profile/pages/user/OrderPage';
import EditProfileModal from '@/components/user/dashboard/EditProfileModal';

function WishlistPage() {
	return <div>Wishlist page</div>;
}

function SettingsPage() {
	return <div>Settings page</div>;
}

function RateOrderModal() {
	const navigate = useNavigate();

	const handleClose = () => {
		navigate(-1);
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
			onClick={handleClose}
		>
			<div
				className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-[0_32px_64px_rgba(0,0,0,0.16)]"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					onClick={handleClose}
					className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				<RateOrderPage />
			</div>
		</div>
	);
}

export default function UserRoutes() {
	const location = useLocation();
	const backgroundLocation = location.state?.backgroundLocation;

	return (
		<>
			<Routes location={backgroundLocation || location}>
				<Route index element={<UserDashboardPage />} />
				<Route path="edit" element={<UserDashboardPage />} />
				<Route path="orders" element={<OrdersPage />} />
				<Route path="orders/:orderId/review" element={<RateOrderPage />} />
				<Route path="wishlist" element={<WishlistPage />} />
				<Route path="settings" element={<SettingsPage />} />
				<Route path="*" element={<Navigate to="/profile" replace />} />
			</Routes>

			{backgroundLocation && (
				<Routes>
					<Route path="edit" element={<EditProfileModal />} />
					<Route path="orders/:orderId/review" element={<RateOrderModal />} />
				</Routes>
			)}

			{location.pathname === '/profile/edit' && !backgroundLocation && (
				<Routes>
					<Route path="edit" element={<EditProfileModal />} />
				</Routes>
			)}
		</>
	);
}
