import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyOrders } from '@/services/profileApi';
import { getOrderForReview } from '@/services/orderReviewApi';
import TopNavbar from '@/components/user/dashboard/TopNavbar';
import Sidebar from '@/components/user/dashboard/Sidebar';
import OrderDetailModal from '@/components/user/order/OrderDetailModal';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function OrdersPage() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('ALL');
	const [reviewableMap, setReviewableMap] = useState({});
	const [searchTerm, setSearchTerm] = useState('');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();

	const [currentPage, setCurrentPage] = useState(0);
	const pageSize = 6;

	const handleOpenDetail = (orderId) => {
		setSelectedOrderId(orderId);
		setIsModalOpen(true);
	};

	// OrdersPage.jsx

	//Hủy đơn hàng
	const handleCancelOrder = async (order) => {
		// Kiểm tra phương thức thanh toán để hiện thông báo phù hợp
		const isPayPalPaid = order?.paymentMethod === 'PAYPAL' && order?.paymentStatus === 'PAID';

		const result = await Swal.fire({
			title: `Cancel Order #${order.id}?`,
			text: isPayPalPaid
				? `Order #${order.id} will be cancelled and your money will be refunded to your PayPal account.`
				: `Are you sure you want to cancel order #${order.id}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, Cancel it',
		});

		if (result.isConfirmed) {
			try {
				const token = localStorage.getItem('token');
				await axios.post(
					`http://localhost:8080/api/users/orders/${order.id}/cancel`,
					{},
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				await Swal.fire('Success', 'Order has been successfully cancelled.', 'success');

				// Cập nhật lại state đơn hàng cục bộ để UI thay đổi ngay lập tức mà không cần reload trang
				setOrders(prevOrders =>
					prevOrders.map(o => o.id === order.id ? { ...o, orderStatus: 'CANCELLED' } : o)
				);

				// Nếu đang mở Modal thì đóng lại
				setIsModalOpen(false);
			} catch (err) {
				Swal.fire('Error', err.response?.data || 'Failed to cancel order', 'error');
			}
		}
	};
	// 1. Fetch toàn bộ dữ liệu để chia trang tại Frontend
	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				// Gọi API với size lớn để lấy hết dữ liệu về xử lý tại FE
				const data = await getMyOrders(0, 1000);
				const orderList = Array.isArray(data?.content) ? data.content : [];
				const sortedOrders = [...orderList].sort((a, b) => {
					const dateA = new Date(a.createdAt || 0);
					const dateB = new Date(b.createdAt || 0);
					return dateB - dateA;
				});
				setOrders(sortedOrders);
			} catch (error) {
				console.error('Failed to load orders:', error);
				setOrders([]);
			} finally {
				setLoading(false);
			}
		};
		fetchOrders();
	}, []);

	// Tự động reset trang khi đổi Tab hoặc tìm kiếm
	useEffect(() => {
		setCurrentPage(0);
	}, [activeTab, searchTerm]);

	// Check trạng thái đánh giá cho các đơn đã giao
	useEffect(() => {
		const checkReviewableOrders = async () => {
			const deliveredOrders = orders.filter((order) => order.orderStatus === 'DELIVERED');
			if (deliveredOrders.length === 0) return;
			try {
				const results = await Promise.all(
					deliveredOrders.map(async (order) => {
						try {
							const data = await getOrderForReview(order.id);
							return [order.id, Array.isArray(data?.items) && data.items.length > 0];
						} catch (error) { return [order.id, false]; }
					}),
				);
				setReviewableMap(Object.fromEntries(results));
			} catch (error) { console.error(error); }
		};
		if (orders.length > 0) checkReviewableOrders();
	}, [orders]);

	// --- CÁC HÀM HELPER ---
	const formatDate = (dateValue) => {
		if (!dateValue) return 'No date';
		return new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
	};

	const formatPrice = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));

	const getOrderTotal = (order) => order.totalPayPrice ?? order.totalBasePrice ?? 0;

	const getItemCount = (order) => order.totalQuantity || (order.orderItems || order.items || []).length;

	const getDisplayProducts = (order) => {
		const items = order.orderItems || order.items || [];
		return items.slice(0, 1).map((item, index) => ({
			id: item.id ?? index,
			name: item.product?.variantName || item.product?.name || 'Product',
			price: item.priceAtPurchase ?? 0,
			quantity: item.quantity,
			imageUrl: item.imageUrl || null,
		}));
	};

	const getPrimaryImage = (order) => {
		const items = order.orderItems || order.items || [];
		return items[0]?.product?.thumbnailUrl || items[0]?.product?.imageUrl || items[0]?.imageUrl || null;
	};

	const getStatusClass = (status) => {
		switch (status) {
			case 'DELIVERED': return 'bg-green-100 text-green-700';
			case 'SHIPPING': return 'bg-blue-100 text-blue-700';
			case 'CONFIRMED': return 'bg-indigo-100 text-indigo-700';
			case 'PENDING': return 'bg-yellow-100 text-yellow-700';
			case 'CANCELLED': return 'bg-red-100 text-red-600';
			case 'RETURNED': return 'bg-orange-100 text-orange-600';
			default: return 'bg-surface-container-highest text-on-surface-variant';
		}
	};

	const needsReview = (order) => order.orderStatus === 'DELIVERED' && reviewableMap[order.id] === true;

	// --- LOGIC LỌC KẾT HỢP SEARCH VÀ TAB ---
	const filteredOrders = useMemo(() => {
		let result = orders;
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase();
			result = result.filter((o) => {
				const idMatch = o.id.toString().includes(term);
				const items = o.orderItems || o.items || [];
				const productMatch = items.some(i => (i.product?.name || '').toLowerCase().includes(term));
				return idMatch || productMatch;
			});
		}
		switch (activeTab) {
			case 'PENDING': return result.filter((o) => o.orderStatus === 'PENDING');
			case 'CONFIRMED': return result.filter((o) => o.orderStatus === 'CONFIRMED');
			case 'SHIPPING': return result.filter((o) => o.orderStatus === 'SHIPPING');
			case 'DELIVERED': return result.filter((o) => o.orderStatus === 'DELIVERED');
			case 'NEEDS_REVIEW': return result.filter((o) => needsReview(o));
			case 'CANCELLED': return result.filter((o) => o.orderStatus === 'CANCELLED');
			default: return result;
		}
	}, [orders, activeTab, reviewableMap, searchTerm]);

	// --- LOGIC THỐNG KÊ (QUICK STATS) ---
	const totalSpent = useMemo(() => orders.reduce((sum, o) => sum + Number(getOrderTotal(o)), 0), [orders]);
	const activeCount = useMemo(() => orders.filter(o => ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(o.orderStatus)).length, [orders]);
	const completedCount = useMemo(() => orders.filter(o => o.orderStatus === 'DELIVERED').length, [orders]);

	// --- CHIA TRANG TẠI FRONTEND ---
	const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
	const paginatedOrders = useMemo(() => {
		const start = currentPage * pageSize;
		return filteredOrders.slice(start, start + pageSize);
	}, [filteredOrders, currentPage]);

	const getPaginationRange = () => {
		const range = [];
		const maxVisiblePages = 3;
		let start = Math.max(0, currentPage - 1);
		let end = Math.min(totalPages - 1, start + maxVisiblePages - 1);
		if (end - start < maxVisiblePages - 1) start = Math.max(0, end - maxVisiblePages + 1);
		for (let i = start; i <= end; i++) range.push(i);
		return range;
	};

	const tabs = [
		{ key: 'ALL', label: 'All Orders' },
		{ key: 'PENDING', label: 'Pending' },
		{ key: 'CONFIRMED', label: 'Confirmed' },
		{ key: 'SHIPPING', label: 'Shipping' },
		{ key: 'DELIVERED', label: 'Completed' },
		{ key: 'NEEDS_REVIEW', label: 'Needs Review' },
		{ key: 'CANCELLED', label: 'Cancelled' },
	];

	return (
		<div className="min-h-screen bg-surface text-on-surface">
			<TopNavbar />
			<div className="flex">
				<Sidebar />
				<main className="ml-64 flex-1 px-8 pb-10 pt-24 lg:px-10">
					<div className="mx-auto w-full max-w-7xl">
						<header className="mb-10">
							<h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface uppercase">Order History</h1>
							<p className="mt-2 font-body text-on-surface-variant">Manage and track your acquisitions.</p>
						</header>

						{/* PHẦN THỐNG KÊ (QUICK STATS) */}
						<div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
							<div className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">{formatPrice(totalSpent)}</p>
							</div>
							<div className="rounded-xl border-l-4 border-secondary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Orders</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">{String(activeCount).padStart(2, '0')}</p>
							</div>
							<div className="rounded-xl border-l-4 border-tertiary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completed</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">{completedCount}</p>
							</div>
						</div>

						{/* THANH TAB */}
						<div className="mb-6 border-b border-outline-variant/30">
							<div className="flex gap-1 overflow-x-auto">
								{tabs.map((tab) => (
									<button
										key={tab.key}
										type="button"
										onClick={() => setActiveTab(tab.key)}
										className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm transition-all ${activeTab === tab.key ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface'}`}
									>
										{tab.label}
									</button>
								))}
							</div>
						</div>

						{/* THANH SEARCH NẰM DƯỚI TAB (GIỐNG COUPON) */}
						<div className="mb-10">
							<div className="relative w-full">
								<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60">search</span>
								<input
									type="text"
									placeholder="Search by Order ID or Product name..."
									className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-4 pl-12 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none transition-all"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						<OrderDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} orderId={selectedOrderId} onCancelOrder={handleCancelOrder} />

						{loading ? (
							<div className="rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant shadow-sm text-center font-bold">Loading orders...</div>
						) : paginatedOrders.length === 0 ? (
							<div className="rounded-xl bg-surface-container-lowest p-12 text-center text-on-surface-variant shadow-sm border border-dashed border-outline-variant">
								<span className="material-symbols-outlined text-5xl opacity-20 mb-2">inventory_2</span>
								<p>No orders found matching your criteria.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
								{paginatedOrders.map((order) => {
									const products = getDisplayProducts(order);
									const primaryImage = getPrimaryImage(order);
									const totalUnits = getItemCount(order);
									const showReviewButton = needsReview(order);

									return (
										<div key={order.id} className={`group rounded-xl bg-surface-container-lowest p-8 shadow-sm transition-all hover:shadow-md ${showReviewButton ? 'border-2 border-transparent hover:border-amber-100/50' : ''}`}>
											<div className="mb-6 flex items-start justify-between gap-4">
												<div className="min-w-0 flex items-center gap-4">
													<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-low">
														{primaryImage ? (
															<img src={primaryImage?.startsWith('http') ? primaryImage : `http://localhost:8080/uploads${primaryImage}`} alt="Order" className="h-full w-full object-cover" />
														) : (
															<span className="material-symbols-outlined text-3xl text-on-surface-variant">inventory_2</span>
														)}
													</div>
													<div className="min-w-0">
														<h3 className="truncate font-headline font-bold text-on-surface">Order #{order.id}</h3>
														<p className="text-xs font-medium text-on-surface-variant">{formatDate(order.createdAt)} • {totalUnits} items</p>
													</div>
												</div>
												<span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${getStatusClass(order.orderStatus)}`}>
													{order.orderStatus?.replaceAll('_', ' ')}
												</span>
											</div>

											<div className="space-y-4 border-b border-outline-variant/20 pb-4 mb-6">
												{products.map((p, idx) => (
													<div key={idx} className="flex items-center gap-3">
														<div className="w-10 h-10 shrink-0 bg-slate-50 border border-slate-100 rounded overflow-hidden flex items-center justify-center">
															<img src={p.imageUrl?.startsWith('http') ? p.imageUrl : `http://localhost:8080/uploads${p.imageUrl}`} alt={p.name} className="w-full h-full object-contain" />
														</div>
														<div className="flex flex-col">
															<span className="line-clamp-1 font-bold text-sm">{p.name} <span className="text-blue-600">x{p.quantity}</span></span>
															<p className="text-[10px] text-slate-400 font-bold uppercase">Unit: {formatPrice(p.price)}</p>
														</div>
													</div>
												))}
											</div>

											<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<div className="text-2xl font-headline font-extrabold text-primary">{formatPrice(getOrderTotal(order))}</div>
												<div className="flex gap-2">
													<button onClick={() => handleOpenDetail(order.id)} className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 active:scale-95 transition-all">
														<span className="material-symbols-outlined text-[18px]">visibility</span> View Details
													</button>
													{(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
														<button
															type="button" // Thêm type để đảm bảo hành vi
															onClick={() => handleCancelOrder(order)} // GẮN HÀM XỬ LÝ TẠI ĐÂY
															className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all"
														>
															Cancel Order
														</button>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}

						{/* FOOTER CHIA TRANG: LUÔN HIỂN THỊ TRANG 1 */}
						<footer className="mt-12 flex flex-col items-center justify-center gap-6 border-t border-outline-variant/20 pt-8">
							<div className="flex items-center gap-3">
								<button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-all">
									<span className="material-symbols-outlined text-xl">chevron_left</span>
								</button>
								<div className="flex items-center gap-2">
									{getPaginationRange().map((pageIndex) => (
										<button key={pageIndex} onClick={() => setCurrentPage(pageIndex)} className={`flex h-10 w-10 items-center justify-center rounded-xl font-black transition-all ${currentPage === pageIndex ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`}>
											{pageIndex + 1}
										</button>
									))}
								</div>
								<button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-all">
									<span className="material-symbols-outlined text-xl">chevron_right</span>
								</button>
							</div>
						</footer>
					</div>
				</main>
			</div>
		</div>
	);
}