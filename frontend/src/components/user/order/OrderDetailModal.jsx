import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
	const [order, setOrder] = useState(null);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	const API_BASE_URL = "http://localhost:8080";
	const UPLOADS_URL = `${API_BASE_URL}/uploads/`;

	useEffect(() => {
		const fetchDetails = async () => {
			if (!isOpen || !orderId) return;
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const headers = { Authorization: `Bearer ${token}` };

				const [orderRes, itemsRes] = await Promise.all([
					axios.get(`http://localhost:8080/api/users/orders/${orderId}`, { headers }),
					axios.get(`http://localhost:8080/api/users/order-details/${orderId}`, { headers }),
				]);

				setOrder(orderRes.data);
				setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
			} catch (error) {
				console.error('Error loading order details:', error);
				Swal.fire('Error', 'Could not load order details', 'error');
			} finally {
				setLoading(false);
			}
		};

		fetchDetails();
	}, [isOpen, orderId]);

	const formatDate = (dateValue) => {
		if (!dateValue) return 'N/A';
		const date = new Date(dateValue);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getStatusClass = (status) => {
		switch (status) {
			case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border border-blue-200';
			case 'SHIPPING': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
			case 'DELIVERED': return 'bg-green-100 text-green-700 border border-green-200';
			case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
			case 'PENDING': return 'bg-amber-100 text-amber-700 border border-amber-200';
			default: return 'bg-slate-100 text-slate-600 border border-slate-200';
		}
	};

	// Handle order cancellation directly within the Modalconst isPayPalPaid = order?.paymentMethod === 'PAYPAL' && order?.paymentStatus === 'PAID';
	const isPayPalPaid = order?.paymentMethod === 'PAYPAL' && order?.paymentStatus === 'PAID';
	const handleCancel = async () => {
		const result = await Swal.fire({
			title: 'Confirm Cancellation?',
			// Dynamic text based on payment method
			text: isPayPalPaid
				? 'Your money will be refunded to your PayPal account.'
				: 'Are you sure you want to cancel this order?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, Cancel it',
		});

		if (result.isConfirmed) {
			try {
				const token = localStorage.getItem('token');
				// Call the existing cancel endpoint
				await axios.post(
					`http://localhost:8080/api/users/orders/${orderId}/cancel`,
					{},
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				await Swal.fire('Success', 'Order has been successfully cancelled.', 'success');
				onClose();
				window.location.reload();
			} catch (err) {
				Swal.fire('Error', err.response?.data || 'Failed to cancel order', 'error');
			}
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
			<div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative p-8 md:p-12">

				{/* Close Button */}
				<button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
					<span className="material-symbols-outlined text-3xl">close</span>
				</button>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
						<p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Details...</p>
					</div>
				) : order && (
					<div className="animate-in fade-in zoom-in duration-300">
						{/* Header Info */}
						<div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
							<div>
								<h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Order Summary</h2>
								<p className="text-sm text-slate-400 font-bold tracking-widest">ID: #{order.id}</p>
								<p className="text-sm text-slate-400 font-bold tracking-widest uppercase">Placed: {formatDate(order.createdAt)}</p>

								{/* HIỂN THỊ NGÀY NHẬN HÀNG NẾU ĐÃ GIAO */}
								{order.orderStatus === 'DELIVERED' && (
									<div className="mt-2 flex items-center gap-2 text-green-600">
										<span className="material-symbols-outlined text-lg">verified</span>
										<p className="text-sm font-black uppercase tracking-widest">
											Received on: {formatDate(order.updatedAt)}
										</p>
									</div>
								)}
							</div>
							<div className="flex flex-col items-end gap-3">
								<span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm ${getStatusClass(order.orderStatus)}`}>
									{order.orderStatus}
								</span>
							</div>
						</div>

						{/* Items Table */}
						<div className="mb-12">
							<div className="grid grid-cols-12 pb-4 border-b-2 border-slate-100 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
								<div className="col-span-6">Product Information</div>
								<div className="col-span-2 text-center">Quantity</div>
								<div className="col-span-4 text-right">Price</div>
							</div>

							<div className="space-y-8">
								{items.map((item) => (
									<div key={item.id} className="grid grid-cols-12 items-center group">
										<div className="col-span-6 flex items-center gap-6">
											<div className="w-20 h-20 rounded-3xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
												<img
													src={
														item.imageUrl
															? (item.imageUrl.startsWith("http")
																? item.imageUrl
																: `${UPLOADS_URL}${item.imageUrl.startsWith("/") ? item.imageUrl.substring(1) : item.imageUrl}`)
															: "/api/placeholder/80/80"
													}
													alt={item.product?.variantName}
													className="w-full h-full object-cover"
													onError={(e) => {
														e.target.onerror = null;
														// Bạn có thể dùng một ảnh mặc định nếu link bị hỏng hoàn toàn
														e.target.src = "https://via.placeholder.com/80?text=No+Image";
													}}
												/>
											</div>
											<div>
												<h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.product?.variantName || 'Product'}</h4>

											</div>
										</div>
										<div className="col-span-2 text-center font-black text-slate-900">
											{item.quantity}
										</div>

										<div className="col-span-4 text-right font-black text-slate-900 text-lg">
											${(item.priceAtPurchase * item.quantity).toFixed(2)}
											<p className="text-[10px] text-slate-400 font-bold uppercase">${item.priceAtPurchase?.toFixed(2)} / unit</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Bottom Section */}
						<div className="grid md:grid-cols-2 gap-12 pt-12 border-t-2 border-slate-100">
							{/* Shipping Address */}
							<div className="space-y-4">
								<h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Shipping To</h3>
								<div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
									<p className="font-black text-slate-900 uppercase text-lg mb-1">{order.shippingName}</p>
									<p className="text-slate-500 font-medium leading-relaxed">{order.shippingAddress}</p>
									<p className="text-slate-500 font-bold mt-2">Tel: {order.shippingPhone}</p>
								</div>
							</div>

							{/* Totals */}
							{/* Totals Section */}
							<div className="bg-slate-900 text-white p-8 rounded-[40px] space-y-4 shadow-xl relative overflow-hidden">
								{/* Subtotal */}
								<div className="flex justify-between opacity-50 text-[10px] font-black uppercase tracking-widest">
									<span>Subtotal</span>
									<span>${order.totalBasePrice?.toFixed(2)}</span>
								</div>

								{/* Shipping Fee - Logic hiển thị FREE */}
								<div className="flex justify-between opacity-50 text-[10px] font-black uppercase tracking-widest">
									<span>Shipping Fee</span>
									<span className={order.shippingFee === 0 ? "text-green-400 font-black" : ""}>
										{order.shippingFee === 0 ? "FREE" : `$${order.shippingFee?.toFixed(2)}`}
									</span>
								</div>

								<div className="flex justify-between opacity-50 text-[10px] font-black uppercase tracking-widest">
									<span>Payment Method</span>
									<span className="text-orange-400">
										{(() => {

											const method = order.paymentMethod?.toUpperCase();
											switch (method) {
												case 'PAYPAL': return 'PayPal / Credit Card';
												case 'VNPAY': return 'VNPay Wallet';
												case 'MOMO': return 'MoMo Wallet';
												case 'COD': return 'Cash on Delivery (COD)';
												default: return order.paymentMethod || 'N/A';
											}
										})()}
									</span>
								</div>

								{/* Discount Amount - Chỉ hiện nếu có giảm giá */}
								{order.discountAmount > 0 && (
									<div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-400">
										<span>Discount</span>
										<span>-${order.discountAmount?.toFixed(2)}</span>
									</div>
								)}

								{/* Total Amount */}
								<div className="flex justify-between items-center pt-6 border-t border-white/10 mt-4">
									<span className="text-sm font-black uppercase tracking-widest text-slate-400">Total Amount</span>
									<span className="text-4xl font-black text-orange-500 tracking-tighter">
										${order.totalPayPrice?.toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						{(order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PENDING') && (
							<button
								onClick={handleCancel}
								className="w-full mt-10 py-5 bg-red-50 text-red-600 font-black rounded-[30px] border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.2em] shadow-sm active:scale-[0.98]"
							>
								{isPayPalPaid ? 'Cancel Order & Refund' : 'Cancel Order'}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default OrderDetailModal;