import React from 'react';
import {LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, Bolt} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';

const menuItems = [
	{label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard', active: true},
	{label: 'Categories', icon: Package, href: 'categories'},
	{label: 'Brands', icon: Package, href: 'brands'},
	{label: 'ProductGroups', icon: Package, href: 'products/groups'},
	{label: 'Products', icon: Package, href: 'products'},
	{label: 'Orders', icon: ShoppingCart, href: 'orders'},
	{label: 'Users', icon: Users, href: 'users'},
	{label: 'Coupons', icon: Package, href: 'coupons'},
	// { label: 'Analytics', icon: BarChart3 },
	{label: 'Settings', icon: Settings, href: 'settings'},
];

export default function AdminSidebar() {
	const currentPath = (window.location.href.split('/admin/')[1] || '/').split('?')[0];
	return (
		<aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col justify-between">
			<div className="flex flex-col p-6 gap-8">
				<Link to={`/admin`}>
					<div className="flex items-center gap-3">
						<div className="bg-sky-500 rounded-xl p-2 text-white">
							<Bolt size={22} />
						</div>

						<div className="flex flex-col">
							<h1 className="text-slate-900 text-lg font-bold leading-none">ElectroMart</h1>
							<p className="text-slate-500 text-xs font-medium">Admin Console</p>
						</div>
					</div>
				</Link>

				<nav className="flex flex-col gap-1">
					{menuItems.map((item) => {
						const Icon = item.icon;

						return (
							<Link
								key={item.label}
								to={`/admin/${item.href}`}
								className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
									currentPath === item.href ? 'bg-sky-100 text-sky-600' : 'text-slate-600 hover:bg-slate-100'
								}`}
							>
								<Icon size={20} />
								<span className={`text-sm ${item.active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</div>

			<div className="p-6 border-t border-slate-100">
				<div className="flex items-center gap-3">
					<img
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzGMsOjc9LIhx6H9amiVMVdo5WqiNfPn_kbAULU_sNY-Mr_wnTfPcpWZc0GNdTNrhdfmqzOQOohYrPlbeHAphOk7lCYAljy5QM2VoU9-lNLrqBjkPnu54zehYRY0_DZep73FvcFDmmwZD_JF5nWzf88VHnE8Ys-Og0q_w03rH9fGRfMmoeZxKB951Oq5R4GwkTibYl0yqUQY6KigtXezLZaI3Ah1gE391VqACa4MabjGQkXS1NvbFprmZzzUgIzOcw9mYoO8qSUN_e"
						alt="Admin avatar"
						className="w-10 h-10 rounded-full border-2 border-slate-200 object-cover"
					/>

					<div className="flex flex-col overflow-hidden">
						<p className="text-sm font-bold text-slate-900 truncate">Alex Johnson</p>
						<p className="text-xs text-slate-500 truncate">System Admin</p>

						<button
							onClick={() => {
								localStorage.removeItem('token');
								window.location.href = '/login';
							}}
							className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium text-left"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</aside>
	);
}
