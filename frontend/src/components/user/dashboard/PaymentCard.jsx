import React from 'react';

export default function PaymentCard() {
	return (
		<div className="relative flex h-1/2 flex-col overflow-hidden rounded-xl bg-gradient-to-br from-inverse-surface to-slate-800 p-8">
			<div className="relative z-10 mb-10 flex items-center justify-between">
				<h3 className="font-headline text-xl font-bold text-white">Primary Payment</h3>
				<span className="material-symbols-outlined cursor-pointer text-white/60 transition-colors hover:text-white">
					settings
				</span>
			</div>

			<div className="relative z-10">
				<div className="mb-4 flex items-end justify-between">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Card Number</p>
						<p className="font-headline text-lg tracking-widest text-white">•••• •••• •••• 8842</p>
					</div>

					<div className="flex h-8 w-12 items-center justify-center rounded border border-white/5 bg-white/10 backdrop-blur-sm">
						<span className="text-xs font-black italic text-white">VISA</span>
					</div>
				</div>

				<div className="flex gap-12">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Expiry</p>
						<p className="text-sm text-white">12/26</p>
					</div>

					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Holder</p>
						<p className="text-sm text-white">ALEX STRATHMORE</p>
					</div>
				</div>
			</div>

			<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary opacity-20 blur-[80px]"></div>
			<div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-400 opacity-10 blur-[60px]"></div>
		</div>
	);
}
