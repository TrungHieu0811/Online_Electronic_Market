import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';

export default function ShippingCard({user}) {
	const navigate = useNavigate();
	const location = useLocation();

	const hasAddress = user?.address && user.address.trim() !== '';

	const handleEdit = () => {
		navigate('/profile/edit', {
			state: {
				backgroundLocation: location,
				user,
			},
		});
	};

	return (
		<div className="relative flex h-1/2 flex-col rounded-xl bg-surface-container-lowest p-8">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="font-headline text-xl font-bold text-on-surface">Default Shipping</h3>

				{/* 🔥 CLICK EDIT */}
				<span
					onClick={handleEdit}
					className="material-symbols-outlined cursor-pointer text-on-surface-variant transition-colors hover:text-primary"
				>
					edit
				</span>
			</div>

			<div className="flex items-start gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
					<span className="material-symbols-outlined">home</span>
				</div>

				<div>
					<p className="mb-1 font-bold text-on-surface">{hasAddress ? 'Primary Residence' : 'No address'}</p>

					{hasAddress ? (
						<p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{user.address}</p>
					) : (
						<p className="text-sm italic text-red-500">Please update your address</p>
					)}
				</div>
			</div>
		</div>
	);
}
