import React, {useState, useEffect, useMemo} from 'react';
import {Plus, Tag, Edit3, Search, ChevronLeft, ChevronRight} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import StatCard from '@/components/admin/StatCard';
import CouponFormModal from '@/components/admin/CouponFormModal';
import api from '@/services/api';

export default function CouponManagementPage() {
	const [coupons, setCoupons] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState(null);

	// States cho Tìm kiếm, Tab Trạng thái và Phân trang
	const [searchTerm, setSearchTerm] = useState('');
	const [activeTab, setActiveTab] = useState('ALL'); // Thay thế filterStatus cũ
	const [filterType, setFilterType] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Danh sách các Tab trạng thái dựa trên CouponStatus Enum
	const tabs = [
		{ key: 'ALL', label: 'All Coupons' },
		{ key: 'ACTIVE', label: 'Active' },
		{ key: 'SCHEDULED', label: 'Scheduled' },
		{ key: 'EXPIRED', label: 'Expired' },
		{ key: 'DISABLED', label: 'Disabled' }
	];

	const fetchCoupons = async () => {
		try {
			const res = await api.get('/admin/coupons');
			setCoupons(res.data);
		} catch (error) {
			console.error('Error fetching coupons', error);
		}
	};

	useEffect(() => {
		fetchCoupons();
	}, []);

	// LOGIC LỌC VÀ TÌM KIẾM
	const filteredCoupons = useMemo(() => {
		const sortedData = [...coupons].sort((a, b) => b.id - a.id);

		return sortedData.filter((coupon) => {
			const matchesSearch =
				coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));

			// Lọc theo Tab trạng thái
			const matchesStatus = activeTab === 'ALL' || coupon.status === activeTab;

			const matchesType = filterType === 'ALL' || coupon.discountType === filterType;

			return matchesSearch && matchesStatus && matchesType;
		});
	}, [coupons, searchTerm, activeTab, filterType]);

	const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
	const currentData = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	const handleEditClick = (coupon) => {
		setSelectedCoupon(coupon);
		setIsModalOpen(true);
	};

	return (
		<div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
			<AdminSidebar />
			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />
				<div className="p-8 space-y-6">
					{/* Header Section */}
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-2xl font-bold text-slate-900">Coupon Management</h1>
							<p className="text-sm text-slate-500 mt-1">Create and manage discount codes for your store.</p>
						</div>
						<button
							onClick={() => {
								setSelectedCoupon(null);
								setIsModalOpen(true);
							}}
							className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-95"
						>
							<Plus size={18} /> Add Coupon
						</button>
					</div>



					{/* Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<StatCard title="Total Coupons" value={coupons.length} icon={<Tag />} iconBg="bg-blue-100" iconColor="text-blue-600" />
						<StatCard title="Active Now" value={coupons.filter(c => c.status === 'ACTIVE').length} icon={<Tag />} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
						<StatCard title="Total Redemptions" value={coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)} icon={<Tag />} iconBg="bg-orange-100" iconColor="text-orange-600" />
					</div>

										{/* Toolbar: Search & Type Filter */}
					<div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
						<div className="flex flex-1 min-w-[300px] items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-sky-500 transition-all">
							<Search size={18} className="text-slate-400" />
							<input
								type="text"
								placeholder="Search by code or description..."
								className="bg-transparent border-none outline-none text-sm w-full"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
							/>
						</div>

						<select
							className="text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-semibold outline-none cursor-pointer hover:bg-slate-100 transition-colors"
							value={filterType}
							onChange={(e) => {
								setFilterType(e.target.value);
								setCurrentPage(1);
							}}
						>
							<option value="ALL">All Types</option>
							<option value="FIXED_AMOUNT">Fixed Amount</option>
							<option value="PERCENTAGE">Percentage</option>
						</select>
					</div>

					{/* Tabs */}
					<div className="border-b border-slate-200">
						<div className="flex gap-8">
							{tabs.map((tab) => (
								<button
									key={tab.key}
									onClick={() => {
										setActiveTab(tab.key);
										setCurrentPage(1);
									}}
									className={`pb-4 text-sm font-bold transition-all relative ${
										activeTab === tab.key 
										? 'text-sky-600' 
										: 'text-slate-500 hover:text-slate-700'
									}`}
								>
									{tab.label}
									{/* Indicator line */}
									{activeTab === tab.key && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full" />
									)}
								</button>
							))}
						</div>
					</div>



					{/* Table Area */}
					<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
						<table className="w-full text-sm text-left">
							<thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
								<tr>
									<th className="px-6 py-4">Code</th>
									<th className="px-6 py-4">Type</th>
									<th className="px-6 py-4">Value</th>
									<th className="px-6 py-4">Usage</th>
									<th className="px-6 py-4">Status</th>
									<th className="px-6 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{currentData.map((coupon) => (
									<tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors group">
										<td className="px-6 py-4 font-bold text-blue-600 uppercase font-mono">{coupon.code}</td>
										<td className="px-6 py-4">
											<span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">
												{coupon.discountType === 'PERCENTAGE' ? 'Percent' : 'Fixed'}
											</span>
										</td>
										<td className="px-6 py-4 font-bold text-slate-700">
											{coupon.discountValue.toLocaleString()} {coupon.discountType === 'PERCENTAGE' ? '%' : '$'}
										</td>
										<td className="px-6 py-4">
											<div className="flex flex-col gap-1 w-24">
												<span className="text-[11px] font-semibold text-slate-500">
													{coupon.usedCount} / {coupon.usageLimit}
												</span>
												<div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
													<div
														className="h-full bg-blue-500"
														style={{width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`}}
													></div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<span
												className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
													coupon.status === 'ACTIVE'
														? 'bg-emerald-100 text-emerald-600'
														: coupon.status === 'SCHEDULED'
															? 'bg-blue-100 text-blue-600'
															: coupon.status === 'EXPIRED'
																? 'bg-red-100 text-red-600'
																: 'bg-slate-100 text-slate-600'
												}`}
											>
												{coupon.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right">
											<button
												onClick={() => handleEditClick(coupon)}
												className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all"
											>
												<Edit3 size={16} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Pagination Footer */}
						<div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
							<p className="text-xs text-slate-500 font-medium">
								Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
								<span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCoupons.length)}</span> of{' '}
								<span className="text-slate-900">{filteredCoupons.length}</span> coupons
							</p>
							<div className="flex gap-2">
								<button
									disabled={currentPage === 1}
									onClick={() => setCurrentPage((prev) => prev - 1)}
									className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								>
									<ChevronLeft size={16} />
								</button>
								<button
									disabled={currentPage === totalPages || totalPages === 0}
									onClick={() => setCurrentPage((prev) => prev + 1)}
									className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								>
									<ChevronRight size={16} />
								</button>
							</div>
						</div>
					</div>
				</div>
			</main>
			<CouponFormModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedCoupon(null);
				}}
				onSuccess={fetchCoupons}
				editData={selectedCoupon}
			/>
		</div>
	);
}