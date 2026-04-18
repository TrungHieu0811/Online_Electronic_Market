import React, {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getMyOrders} from '@/services/profileApi';
import {getOrderForReview} from '@/services/orderReviewApi';
import TopNavbar from '@/components/user/dashboard/TopNavbar';
import Sidebar from '@/components/user/dashboard/Sidebar';
import OrderDetailModal from '@/components/user/order/OrderDetailModal';

export default function OrdersPage() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('ALL');
	const [reviewableMap, setReviewableMap] = useState({});

	// Modal States
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();

	const handleOpenDetail = (orderId) => {
		setSelectedOrderId(orderId);
		setIsModalOpen(true);
	};

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				const data = await getMyOrders();

				// Backend trả về Page<Order>, nên lấy data.content
				const orderList = Array.isArray(data?.content) ? data.content : [];

				const sortedOrders = [...orderList].sort((a, b) => {
					const dateA = new Date(a.createdAt || a.created_at || 0);
					const dateB = new Date(b.createdAt || b.created_at || 0);
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

	useEffect(() => {
		const checkReviewableOrders = async () => {
			const deliveredOrders = orders.filter((order) => order.orderStatus === 'DELIVERED');

			if (deliveredOrders.length === 0) {
				setReviewableMap({});
				return;
			}

			try {
				const results = await Promise.all(
					deliveredOrders.map(async (order) => {
						try {
							const data = await getOrderForReview(order.id);
							const hasItemsToReview = Array.isArray(data?.items) && data.items.length > 0;
							return [order.id, hasItemsToReview];
						} catch (error) {
							console.error(`Failed to check reviewable items for order ${order.id}:`, error);
							return [order.id, false];
						}
					}),
				);

				setReviewableMap(Object.fromEntries(results));
			} catch (error) {
				console.error('Failed to check reviewable orders:', error);
				setReviewableMap({});
			}
		};

		if (orders.length > 0) {
			checkReviewableOrders();
		} else {
			setReviewableMap({});
		}
	}, [orders]);

	const formatDate = (dateValue) => {
		if (!dateValue) return 'No date';

		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) return 'No date';

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric',
		});
	};

	const formatPrice = (value) => {
		const number = Number(value ?? 0);
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(number);
	};

	const getOrderDate = (order) => order.createdAt || order.created_at || null;

	const getOrderTotal = (order) =>
		order.totalPayPrice ?? order.total_pay_price ?? order.totalBasePrice ?? order.total_base_price ?? 0;

	const getItemCount = (order) => {
		// 1. Ưu tiên lấy từ trường tổng số lượng của Backend (nếu có)
		if (order.totalQuantity !== undefined) return order.totalQuantity;
		if (order.total_quantity !== undefined) return order.total_quantity;

		// 2. Fallback: Nếu Backend trả về mảng items, thì mới đếm độ dài mảng
		if (Array.isArray(order.orderItems)) return order.orderItems.length;
		if (Array.isArray(order.items)) return order.items.length;

		return 0;
	};

	// Trong OrderPage.jsx
	const getDisplayProducts = (order) => {
		const items = order.orderItems || order.items || [];

		// Chỉ lấy món hàng đầu tiên làm đại diện
		return items.slice(0, 1).map((item, index) => ({
			id: item.id ?? index,
			name: item.product?.variantName || item.product?.name || 'Product',
			price: item.priceAtPurchase ?? 0,
			quantity: item.quantity,
			// Lấy link ảnh từ backend
			imageUrl: item.imageUrl || null,
		}));
	};

	const getPrimaryImage = (order) => {
		const items = order.orderItems || order.items || [];
		const first = items[0];
		return first?.product?.thumbnailUrl || first?.product?.imageUrl || first?.imageUrl || null;
	};

	const getStatusClass = (status) => {
		switch (status) {
			case 'DELIVERED':
				return 'bg-green-100 text-green-700';
			case 'SHIPPING':
				return 'bg-blue-100 text-blue-700';
			case 'CONFIRMED':
				return 'bg-indigo-100 text-indigo-700';
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-700';
			case 'CANCELLED':
				return 'bg-red-100 text-red-600';
			case 'RETURNED':
				return 'bg-orange-100 text-orange-600';
			default:
				return 'bg-surface-container-highest text-on-surface-variant';
		}
	};

	const normalizeStatus = (status) => {
		if (!status) return 'UNKNOWN';
		return status.replaceAll('_', ' ');
	};

	const needsReview = (order) => {
		return order.orderStatus === 'DELIVERED' && reviewableMap[order.id] === true;
	};

	const filteredOrders = useMemo(() => {
		switch (activeTab) {
			case 'PENDING':
				return orders.filter((o) => o.orderStatus === 'PENDING');
			case 'CONFIRMED':
				return orders.filter((o) => o.orderStatus === 'CONFIRMED');
			case 'SHIPPING':
				return orders.filter((o) => o.orderStatus === 'SHIPPING');
			case 'DELIVERED':
				return orders.filter((o) => o.orderStatus === 'DELIVERED');
			case 'NEEDS_REVIEW':
				return orders.filter((o) => needsReview(o)); // Logic giữ nguyên
			case 'CANCELLED':
				return orders.filter((o) => o.orderStatus === 'CANCELLED');
			default:
				return orders;
		}
	}, [orders, activeTab, reviewableMap]);

	const totalSpent = useMemo(() => {
		return orders.reduce((sum, order) => sum + Number(getOrderTotal(order)), 0);
	}, [orders]);

	const activeOrdersCount = useMemo(() => {
		return orders.filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(o.orderStatus)).length;
	}, [orders]);

	const deliveredCount = useMemo(() => {
		return orders.filter((o) => o.orderStatus === 'DELIVERED').length;
	}, [orders]);

	const handleOpenReview = (order) => {
		navigate(`/profile/orders/${order.id}/review`, {
			state: {
				backgroundLocation: location,
				order,
			},
		});
	};

	const handleOpenReviewedDetails = (order) => {
		navigate(`/profile/orders/${order.id}/review`, {
			state: {
				backgroundLocation: location,
				order,
			},
		});
	};

	const tabs = [
		{key: 'ALL', label: 'All Orders', icon: null},
		{key: 'PENDING', label: 'Pending', icon: 'schedule'},
		{key: 'CONFIRMED', label: 'Confirmed', icon: 'inventory_2'},
		{key: 'SHIPPING', label: 'Shipping', icon: 'local_shipping'},
		{key: 'DELIVERED', label: 'Completed', icon: 'check_circle'},
		{key: 'NEEDS_REVIEW', label: 'Needs Review', icon: 'star'}, // Giữ nguyên theo yêu cầu
		{key: 'CANCELLED', label: 'Cancelled', icon: 'cancel'},
	];

	return (
		<div className="min-h-screen bg-surface text-on-surface">
			<TopNavbar />

			<div className="flex">
				<Sidebar />

				<main className="ml-64 flex-1 px-8 pb-10 pt-24 lg:px-10">
					<div className="mx-auto w-full max-w-7xl">
						<header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Order History</h1>
								<p className="mt-2 font-body text-on-surface-variant">Manage and track your recent electronic acquisitions.</p>
							</div>

							<div className="flex flex-wrap gap-3">
								{/* <button className="flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-medium text-on-secondary-fixed-variant transition-all hover:bg-surface-container-highest">
									<span className="material-symbols-outlined text-lg">filter_list</span>
									Filter
								</button> */}

								{/* <button className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all active:scale-95">
									Download Report
								</button> */}
							</div>
						</header>

						<div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
							<div className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">{formatPrice(totalSpent)}</p>
							</div>

							<div className="rounded-xl border-l-4 border-secondary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Orders</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">
									{String(activeOrdersCount).padStart(2, '0')}
								</p>
							</div>

							<div className="rounded-xl border-l-4 border-tertiary bg-surface-container-lowest p-6 shadow-sm">
								<p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completed</p>
								<p className="mt-1 text-3xl font-headline font-bold text-on-surface">{deliveredCount}</p>
							</div>
						</div>

						<div className="mb-8 border-b border-outline-variant/30">
							<div className="flex gap-1 overflow-x-auto">
								{tabs.map((tab) => (
									<button
										key={tab.key}
										type="button"
										onClick={() => setActiveTab(tab.key)}
										className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm transition-all ${
											activeTab === tab.key
												? 'border-primary font-bold text-primary'
												: tab.key === 'NEEDS_REVIEW'
													? 'border-transparent font-bold text-amber-700 hover:bg-amber-50'
													: 'border-transparent font-medium text-on-surface-variant hover:text-on-surface'
										}`}
									>
										{tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
										{tab.label}
										{tab.key === 'DELIVERED' && deliveredCount > 0 && (
											<span className="rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-bold text-on-surface">
												({deliveredCount})
											</span>
										)}
									</button>
								))}
							</div>
						</div>
						<OrderDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} orderId={selectedOrderId} />

						{loading ? (
							<div className="rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant shadow-sm">
								Loading orders...
							</div>
						) : filteredOrders.length === 0 ? (
							<div className="rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant shadow-sm">
								No orders found.
							</div>
						) : (
							<div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
								{filteredOrders.map((order) => {
									const products = getDisplayProducts(order);
									const primaryImage = getPrimaryImage(order);
									const total = getOrderTotal(order);
									const orderDate = getOrderDate(order);
									// 2. Định nghĩa các biến đếm (Sửa lỗi ReferenceError)
									const totalUnits = getItemCount(order); // Tổng số lượng (ví dụ: 3 cái iPhone)
									const distinctItemsCount = (order.orderItems || order.items || []).length;
									const showReviewButton = needsReview(order);
									const isDeliveredWithoutReviewItems = order.orderStatus === 'DELIVERED' && reviewableMap[order.id] === false;

									return (
										<div
											key={order.id}
											className={`group rounded-xl bg-surface-container-lowest p-8 shadow-[0_12px_32px_rgba(0,26,64,0.04)] transition-all hover:shadow-[0_12px_32px_rgba(0,26,64,0.08)] ${
												showReviewButton ? 'border-2 border-transparent hover:border-amber-100/50' : ''
											}`}
										>
											<div className="mb-6 flex items-start justify-between gap-4">
												<div className="min-w-0 flex items-center gap-4">
													<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-low overflow-hidden">
														{primaryImage ? (
															<img
																src={
																	primaryImage?.startsWith('http') ? primaryImage : `${'http://localhost:8080/uploads' + primaryImage}`
																}
																alt="Order item"
																className="h-full w-full object-cover"
															/>
														) : (
															<span className="material-symbols-outlined text-3xl text-on-surface-variant">inventory_2</span>
														)}
													</div>

													<div className="min-w-0">
														<h3 className="truncate font-headline font-bold text-on-surface">Order #{order.id}</h3>
														<p className="text-xs font-medium text-on-surface-variant">
															{formatDate(orderDate)} • {totalUnits} item{totalUnits !== 1 ? 's' : ''}
														</p>
													</div>
												</div>

												<div className="shrink-0 flex flex-col items-end gap-2">
													<span
														className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(order.orderStatus)}`}
													>
														{normalizeStatus(order.orderStatus)}
													</span>

													{showReviewButton && (
														<span className="flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-amber-600">
															<span className="material-symbols-outlined text-sm">priority_high</span>
															Action Required
														</span>
													)}
												</div>
											</div>
											<div className="space-y-4">
												{products.length > 0 ? (
													<div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 pb-4 text-sm">
														<div className="flex items-center gap-3">
															{/* KHUNG HIỂN THỊ HÌNH ẢNH SẢN PHẨM */}
															<div className="w-12 h-12 shrink-0 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-0 overflow-hidden">
																{products[0].imageUrl ? (
																	<img
																		src={
																			products[0].imageUrl?.startsWith('http')
																				? products[0].imageUrl
																				: `${'http://localhost:8080/uploads' + products[0].imageUrl}`
																		}
																		alt={products[0].name}
																		className="w-full h-full object-contain"
																	/>
																) : (
																	<span className="material-symbols-outlined text-slate-300 text-xl">image</span>
																)}
															</div>

															<div className="flex flex-col">
																<div className="flex items-center gap-2">
																	<span className="line-clamp-1 font-bold text-on-surface">
																		{products[0].name}
																		<span className="ml-1.5 text-blue-600 font-black">x{products[0].quantity}</span>
																	</span>

																	{distinctItemsCount > 1 && (
																		<span className="shrink-0 text-[9px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase">
																			+ {distinctItemsCount - 1} more
																		</span>
																	)}
																</div>
																{/* Hiển thị giá đơn vị nhỏ bên dưới tên nếu muốn */}
																<p className="text-[10px] text-slate-400 font-bold uppercase">
																	Unit Price: {formatPrice(products[0].price)}
																</p>
															</div>
														</div>

														{/* Tổng giá trị của toàn bộ đơn hàng ở bên phải (giá trị 'total' đã có sẵn) */}
													</div>
												) : (
													<div className="border-b border-outline-variant/20 pb-4 text-sm text-on-surface-variant italic">
														Order preview unavailable
													</div>
												)}
											</div>

											<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<div className="text-2xl font-headline font-extrabold text-primary">{formatPrice(total)}</div>

												<button
													type="button"
													onClick={() => handleOpenDetail(order.id)}
													className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 transition-all shadow-sm active:scale-95"
												>
													<span className="material-symbols-outlined text-[18px]">visibility</span>
													View Details
												</button>

												{showReviewButton && (
													<button
														onClick={() => navigate(`/profile/orders/${order.id}/review`)}
														className="bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 shadow-md transition-all"
													>
														Write Review
													</button>
												)}

												{(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
													<button
														onClick={() => handleOpenDetail(order.id)}
														className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all"
													>
														Cancel Order
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}

						<footer className="mt-12 flex flex-col gap-4 border-t border-outline-variant/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-on-surface-variant">
								Showing {filteredOrders.length} of {orders.length} orders
							</p>

							<div className="flex gap-2">
								<button
									type="button"
									className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-all hover:bg-surface-container-highest"
								>
									<span className="material-symbols-outlined">chevron_left</span>
								</button>

								<button
									type="button"
									className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-white"
								>
									1
								</button>

								<button
									type="button"
									className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-all hover:bg-surface-container-highest"
								>
									<span className="material-symbols-outlined">chevron_right</span>
								</button>
							</div>
						</footer>
					</div>
				</main>
			</div>
		</div>
	);
}
