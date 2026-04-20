import React, {useEffect, useMemo, useState} from 'react';
import {
	Bell,
	UserPlus,
	Search,
	SlidersHorizontal,
	ChevronLeft,
	ChevronRight,
	Users,
	TrendingUp,
	Ban,
	X,
	ShieldAlert,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import {getAdminUsers, getAdminUserStats, blockAdminUser, unblockAdminUser} from '@/services/adminUserApi';

const BLOCK_REASON_OPTIONS = [
	'Spam / fake account activity',
	'Abusive or inappropriate behavior',
	'Multiple failed delivery attempts',
	'Violation of marketplace policy',
	'Fraudulent payment behavior',
	'Other',
];

function getRoleBadge(role) {
	switch (role) {
		case 'ROLE_SUPERADMIN':
		case 'ROLE_ADMIN':
		case 'ADMIN':
			return 'bg-orange-50 text-orange-600';
		case 'ROLE_STAFF':
		case 'MODERATOR':
			return 'bg-blue-50 text-blue-600';
		case 'ROLE_USER':
		case 'CUSTOMER':
		default:
			return 'bg-slate-100 text-slate-600';
	}
}

function getRoleLabel(role) {
	switch (role) {
		case 'ROLE_SUPERADMIN':
			return 'SUPER ADMIN';
		case 'ROLE_ADMIN':
			return 'ADMIN';
		case 'ROLE_STAFF':
			return 'STAFF';
		case 'ROLE_USER':
			return 'CUSTOMER';
		default:
			return role || 'CUSTOMER';
	}
}

function getStatusStyle(status) {
	if (status === 'Active' || status === true) {
		return {
			dot: 'bg-emerald-500',
			text: 'text-emerald-500',
			action: 'Block',
			actionClass: 'text-rose-500 hover:text-rose-600',
		};
	}

	return {
		dot: 'bg-rose-500',
		text: 'text-rose-500',
		action: 'Unblock',
		actionClass: 'text-emerald-500 hover:text-emerald-600',
	};
}

function getInitials(name) {
	if (!name || !name.trim()) return 'U';
	const words = name.trim().split(/\s+/);
	if (words.length === 1) return words[0].charAt(0).toUpperCase();
	return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
}

function formatJoinDate(value) {
	if (!value) return '--';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '--';

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric',
	}).format(date);
}

export default function UserManagementPage() {
	const [users, setUsers] = useState([]);
	const [stats, setStats] = useState({
		totalUsers: 0,
		newToday: 0,
		blockedUsers: 0,
	});

	// 👉 STATE QUẢN LÝ TAB
	const [activeTab, setActiveTab] = useState('USER');

	const [keyword, setKeyword] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const [page, setPage] = useState(0);
	const [size] = useState(10);

	const [loadingUsers, setLoadingUsers] = useState(true);
	const [loadingStats, setLoadingStats] = useState(true);
	const [actionLoadingId, setActionLoadingId] = useState(null);

	const [pagination, setPagination] = useState({
		totalPages: 1,
		totalElements: 0,
		currentPage: 0,
	});

	const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedReason, setSelectedReason] = useState(BLOCK_REASON_OPTIONS[0]);
	const [customReason, setCustomReason] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			setKeyword(searchInput.trim());
			setPage(0);
		}, 400);

		return () => clearTimeout(timer);
	}, [searchInput]);

	// 👉 SỬA HÀM NÀY: Phải đón currentTab và truyền roleType xuống
	const fetchUsers = async (currentPage = page, currentKeyword = keyword, currentTab = activeTab) => {
		try {
			setLoadingUsers(true);

			const response = await getAdminUsers({
				keyword: currentKeyword,
				page: currentPage,
				size: size,
				roleType: currentTab // 👉 CHÍNH LÀ DÒNG NÀY! Thiếu dòng này API sẽ luôn múc tab USER
			});

			setUsers(response?.content || []);
			setPagination({
				totalPages: response?.totalPages || 1,
				totalElements: response?.totalElements || 0,
				currentPage: response?.currentPage || 0,
			});
		} catch (error) {
			console.error('Failed to fetch users:', error);
			setUsers([]);
			setPagination({
				totalPages: 1,
				totalElements: 0,
				currentPage: 0,
			});
		} finally {
			setLoadingUsers(false);
		}
	};

	const fetchStats = async () => {
		try {
			setLoadingStats(true);
			const response = await getAdminUserStats();
			setStats({
				totalUsers: response?.totalUsers || 0,
				newToday: response?.newToday || 0,
				blockedUsers: response?.blockedUsers || 0,
			});
		} catch (error) {
			console.error('Failed to fetch user stats:', error);
		} finally {
			setLoadingStats(false);
		}
	};

	// 👉 SỬA LUÔN CHỖ NÀY: Khi activeTab thay đổi, phải gọi fetchUsers và nhét activeTab vào
	useEffect(() => {
		fetchUsers(page, keyword, activeTab);
	}, [page, keyword, activeTab]); // <--- Đảm bảo có chữ activeTab ở trong mảng này

	useEffect(() => {
		fetchStats();
	}, []);

	// 👉 BỘ LỌC THẦN THÁNH Ở FRONTEND (Ẩn SuperAdmin + Chia Tab)
	const filteredUsers = useMemo(() => {
		return users.filter(user => {
			// 1. Gặp SuperAdmin là chém luôn, không cho lên UI
			if (user.role === 'ROLE_SUPERADMIN' || user.role === 'SUPERADMIN') {
				return false;
			}

			// 2. Chia phe theo Tab
			if (activeTab === 'USER') {
				return user.role === 'ROLE_USER' || user.role === 'CUSTOMER';
			} else {
				return user.role === 'ROLE_ADMIN' || user.role === 'ROLE_STAFF' || user.role === 'ADMIN' || user.role === 'STAFF';
			}
		});
	}, [users, activeTab]);

	const openBlockModal = (user) => {
		setSelectedUser(user);
		setSelectedReason(BLOCK_REASON_OPTIONS[0]);
		setCustomReason('');
		setIsBlockModalOpen(true);
	};

	const closeBlockModal = () => {
		if (actionLoadingId) return;
		setIsBlockModalOpen(false);
		setSelectedUser(null);
	};

	const confirmBlockUser = async () => {
		if (!selectedUser) return;
		const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
		if (!finalReason) {
			alert('Please enter a block reason.');
			return;
		}

		try {
			setActionLoadingId(selectedUser.id);
			await blockAdminUser(selectedUser.id, finalReason);
			closeBlockModal();
			await Promise.all([fetchUsers(page, keyword), fetchStats()]);
		} catch (error) {
			console.error('Failed to block user:', error);
			alert('Block action failed. Please try again.');
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleToggleUserStatus = async (user) => {
		try {
			if (user.status === 'Active' || user.status === true) {
				openBlockModal(user);
				return;
			}
			setActionLoadingId(user.id);
			await unblockAdminUser(user.id);
			await Promise.all([fetchUsers(page, keyword), fetchStats()]);
		} catch (error) {
			console.error('Failed to update user status:', error);
			alert('Action failed. Please try again.');
		} finally {
			setActionLoadingId(null);
		}
	};

	const visiblePages = useMemo(() => {
		const total = pagination.totalPages || 1;
		const current = pagination.currentPage || 0;

		if (total <= 5) return Array.from({length: total}, (_, i) => i);
		if (current <= 2) return [0, 1, 2, 3, total - 1];
		if (current >= total - 3) return [0, total - 4, total - 3, total - 2, total - 1];
		return [0, current - 1, current, current + 1, total - 1];
	}, [pagination]);

	return (
		<div className="flex min-h-screen bg-[#f8f6f6]">
			<AdminSidebar />

			<main className="flex-1 min-w-0 flex flex-col">
				<header className="h-16 sticky top-0 z-10 flex items-center justify-between px-8 border-b border-slate-200 bg-white/90 backdrop-blur-md">
					<div className="flex items-center gap-2 text-sm">
						<span className="text-slate-500">Pages</span>
						<span className="text-slate-400">/</span>
						<span className="font-medium text-slate-800">User Management</span>
					</div>

					<div className="flex items-center gap-4">
						<button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
							<Bell size={18} />
						</button>
						<div className="h-8 w-px bg-slate-200" />
					</div>
				</header>

				<div className="w-full max-w-7xl mx-auto p-8">
					<div className="mb-8">
						<h1 className="text-5xl/[1.1] font-black tracking-tight text-slate-950">User Directory</h1>
						<p className="mt-3 text-xl text-slate-500">
							View and manage all registered customer accounts and administrator roles.
						</p>
					</div>

					{/* 👉 THANH ĐIỀU HƯỚNG TABS */}
					<div className="mb-6 flex gap-8 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('USER')}
							className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
								activeTab === 'USER' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
							}`}
						>
							Customers
							{activeTab === 'USER' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full" />
							)}
						</button>
						<button
							onClick={() => setActiveTab('ADMIN')}
							className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
								activeTab === 'ADMIN' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
							}`}
						>
							Administrators
							{activeTab === 'ADMIN' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full" />
							)}
						</button>
					</div>

					<div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex flex-col gap-4 md:flex-row">
							<div className="relative flex-1">
								<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
								<input
									type="text"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder={`Search ${activeTab === 'USER' ? 'customers' : 'administrators'} by name or email...`}
									className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 border border-transparent focus:border-orange-200"
								/>
							</div>

							<div className="flex gap-3">
								{/* Nút thêm Admin mới (chỉ hiện khi đang ở tab ADMIN) */}
								{activeTab === 'ADMIN' && (
									<button 
										onClick={() => window.location.href = '/admin/create-admin'}
										className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition-colors"
									>
										<UserPlus size={16} />
										<span>New Admin</span>
									</button>
								)}
								<button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
									<SlidersHorizontal size={16} className="text-slate-500" />
									<span>Filters</span>
								</button>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead className="border-b border-slate-200 bg-slate-50">
									<tr>
										<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">User</th>
										<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Email</th>
										<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Join Date</th>
										<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Role</th>
										<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
										<th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100">
									{loadingUsers ? (
										[...Array(6)].map((_, index) => (
											<tr key={index}>
												<td className="px-6 py-5"><div className="h-5 w-36 rounded bg-slate-200 animate-pulse" /></td>
												<td className="px-6 py-5"><div className="h-5 w-48 rounded bg-slate-200 animate-pulse" /></td>
												<td className="px-6 py-5"><div className="h-5 w-24 rounded bg-slate-200 animate-pulse" /></td>
												<td className="px-6 py-5"><div className="h-5 w-20 rounded bg-slate-200 animate-pulse" /></td>
												<td className="px-6 py-5"><div className="h-5 w-20 rounded bg-slate-200 animate-pulse" /></td>
												<td className="px-6 py-5"><div className="ml-auto h-5 w-24 rounded bg-slate-200 animate-pulse" /></td>
											</tr>
										))
									) : filteredUsers.length === 0 ? (
										<tr>
											<td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-400">
												No {activeTab === 'USER' ? 'customers' : 'administrators'} found
											</td>
										</tr>
									) : (
										// 👉 RENDER BẢNG VỚI DỮ LIỆU ĐÃ ĐƯỢC LỌC TRÊN FRONTEND
										filteredUsers.map((user) => {
											const statusStyle = getStatusStyle(user.status);
											// 👉 KIỂM TRA XEM HÀNG NÀY CÓ PHẢI LÀ ADMIN KHÔNG ĐỂ ẨN NÚT BLOCK
											const isTargetAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ROLE_STAFF' || user.role === 'ADMIN' || user.role === 'STAFF';

											return (
												<tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
													<td className="px-6 py-5">
														<div className="flex items-center gap-4">
															{user.avatar ? (
																<img
																	src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8080/uploads${user.avatar}`}
																	alt={user.name || 'User avatar'}
																	className="h-11 w-11 rounded-full object-cover border border-slate-200"
																/>
															) : (
																<div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
																	{getInitials(user.name || user.fullName)}
																</div>
															)}

															<span className={`text-sm font-semibold ${user.status === 'Blocked' || user.status === false ? 'text-slate-500' : 'text-slate-900'}`}>
																{user.name || user.fullName || user.email || 'Unknown User'}
															</span>
														</div>
													</td>

													<td className={`px-6 py-5 text-sm ${user.status === 'Blocked' || user.status === false ? 'italic text-slate-500' : 'text-slate-600'}`}>
														{user.email}
													</td>

													<td className="px-6 py-5 text-sm text-slate-600">{formatJoinDate(user.createdAt)}</td>

													<td className="px-6 py-5">
														<span className={`inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide ${getRoleBadge(user.role)}`}>
															{getRoleLabel(user.role)}
														</span>
													</td>

													<td className="px-6 py-5">
														<div className={`flex items-center gap-2 text-xs font-semibold ${statusStyle.text}`}>
															<span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
															<span>{user.status === true ? 'Active' : (user.status === false ? 'Blocked' : user.status)}</span>
														</div>
													</td>

													<td className="px-6 py-5">
														<div className="flex justify-end gap-3 text-xs font-bold">
															<button className="text-slate-500 hover:text-orange-600 transition-colors">View Profile</button>
															
															{/* 👉 ĐIỀU KIỆN ẨN NÚT BLOCK: Chỉ hiện nếu người này KHÔNG PHẢI Admin/Staff */}
															{!isTargetAdmin && (
																<button
																	onClick={() => handleToggleUserStatus(user)}
																	disabled={actionLoadingId === user.id}
																	className={`${statusStyle.actionClass} transition-colors disabled:opacity-50`}
																>
																	{actionLoadingId === user.id ? 'Loading...' : statusStyle.action}
																</button>
															)}
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4">
							{/* <p className="text-xs font-medium text-slate-500">
								Showing {pagination.totalElements === 0 ? 0 : pagination.currentPage * size + 1} to{' '}
								{Math.min((pagination.currentPage + 1) * size, pagination.totalElements)} of {pagination.totalElements} users
							</p> */}

							<div className="flex items-center gap-2">
								<button disabled={pagination.currentPage === 0} onClick={() => setPage((prev) => Math.max(prev - 1, 0))} className="p-1 text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:hover:text-slate-400">
									<ChevronLeft size={18} />
								</button>
								<div className="flex items-center gap-1">
									{visiblePages.map((pageNumber, index) => {
										const prev = visiblePages[index - 1];
										const showEllipsis = index > 0 && pageNumber - prev > 1;

										return (
											<React.Fragment key={pageNumber}>
												{showEllipsis && <span className="px-1 text-slate-400">...</span>}
												<button onClick={() => setPage(pageNumber)} className={`h-9 w-9 rounded-xl text-xs font-bold ${pagination.currentPage === pageNumber ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
													{pageNumber + 1}
												</button>
											</React.Fragment>
										);
									})}
								</div>
								<button disabled={pagination.currentPage >= Math.max((pagination.totalPages || 1) - 1, 0)} onClick={() => setPage((prev) => Math.min(prev + 1, Math.max((pagination.totalPages || 1) - 1, 0)))} className="p-1 text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:hover:text-slate-400">
									<ChevronRight size={18} />
								</button>
							</div>
						</div>
					</div>

					{/* Stats giữ nguyên */}
					<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600"><Users size={22} /></div>
							<div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Total Users</p><p className="text-2xl font-black text-slate-950">{loadingStats ? '...' : stats.totalUsers}</p></div>
						</div>
						<div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-500"><TrendingUp size={22} /></div>
							<div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">New Today</p><p className="text-2xl font-black text-slate-950">{loadingStats ? '...' : `+${stats.newToday}`}</p></div>
						</div>
						<div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500"><Ban size={22} /></div>
							<div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Blocked Accounts</p><p className="text-2xl font-black text-slate-950">{loadingStats ? '...' : stats.blockedUsers}</p></div>
						</div>
					</div>
				</div>
			</main>

			{/* Modal giữ nguyên */}
			{isBlockModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
					<div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200">
						<div className="flex items-start justify-between p-6 border-b border-slate-100">
							<div className="flex items-start gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
									<ShieldAlert size={24} />
								</div>
								<div>
									<h3 className="text-xl font-bold text-slate-900">Block User Account</h3>
									<p className="mt-1 text-sm text-slate-500">
										Choose a reason for blocking <span className="font-semibold text-slate-700">{selectedUser?.name || selectedUser?.email}</span>
									</p>
								</div>
							</div>
							<button onClick={closeBlockModal} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X size={18} /></button>
						</div>

						<div className="p-6 space-y-4">
							<div>
								<label className="mb-3 block text-sm font-semibold text-slate-700">Select reason</label>
								<div className="grid grid-cols-1 gap-3">
									{BLOCK_REASON_OPTIONS.map((reason) => (
										<label key={reason} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${selectedReason === reason ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
											<input type="radio" name="blockReason" value={reason} checked={selectedReason === reason} onChange={() => setSelectedReason(reason)} className="h-4 w-4 accent-orange-600" />
											<span className="text-sm font-medium text-slate-700">{reason}</span>
										</label>
									))}
								</div>
							</div>

							{selectedReason === 'Other' && (
								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-700">Custom reason</label>
									<textarea rows={4} value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Enter detailed block reason..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-300" />
								</div>
							)}
						</div>

						<div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
							<button onClick={closeBlockModal} disabled={!!actionLoadingId} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
							<button onClick={confirmBlockUser} disabled={!!actionLoadingId || (selectedReason === 'Other' && !customReason.trim())} className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
								{actionLoadingId === selectedUser?.id ? 'Blocking...' : 'Confirm Block'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}