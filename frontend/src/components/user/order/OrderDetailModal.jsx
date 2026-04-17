import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const OrderDetailModal = ({isOpen, onClose, orderId}) => {
	const [order, setOrder] = useState(null);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDetails = async () => {
			if (!isOpen || !orderId) return;
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const headers = {Authorization: `Bearer ${token}`};

				// Fetching Order Info and Order Items simultaneously
				const [orderRes, itemsRes] = await Promise.all([
					axios.get(`http://localhost:8080/api/users/orders/${orderId}`, {headers}),
					axios.get(`http://localhost:8080/api/users/order-details/${orderId}`, {headers}),
				]);

				setOrder(orderRes.data);
				setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
			} catch (error) {
				console.error('Error loading order details:', error);
				Swal.fire('Error', 'Could not load order details.', 'error');
				onClose();
			} finally {
				setLoading(false);
			}
		};
		fetchDetails();
	}, [isOpen, orderId]);
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
						headers: {Authorization: `Bearer ${token}`},
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
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				{loading ? (
					<div className="p-20 text-center font-bold text-slate-500 animate-pulse text-xl">Loading data...</div>
				) : (
					order && (
						<div className="p-8">
							<div className="mb-8 border-b pb-6">
								<h2 className="text-3xl font-black text-slate-900 uppercase">Order Details</h2>
								<div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
									<p className="text-slate-500 font-bold text-sm uppercase">
										Order ID: <span className="text-slate-900">#{order.id}</span>
									</p>
									<p className="text-slate-500 font-bold text-sm uppercase">
										Order Date:{' '}
										<span className="text-slate-900">
											{new Date(order.createdAt).toLocaleDateString('en-US', {
												day: '2-digit',
												month: 'long',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</p>
								</div>
							</div>

							{/* Product List */}
							<div className="mb-10 space-y-4">
								{items.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all overflow-hidden"
									>
										<div className="w-20 h-20 bg-white rounded-xl p-0 border flex-shrink-0 overflow-hidden">
											<img
												src={item.imageUrl?.startsWith('http') ? item.imageUrl : `http://localhost:8080/uploads${item.imageUrl}`}
												className="w-full h-full object-contain"
												alt=""
											/>
										</div>
										<div className="flex-1">
											<h4 className="font-bold text-slate-800 text-lg leading-tight">{item.product?.variantName || 'Product'}</h4>
											<p className="text-xs font-bold text-slate-400 mt-1 uppercase">Quantity: {item.quantity}</p>
										</div>
										<div className="text-right">
											<p className="font-black text-xl text-slate-900">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
											<p className="text-[10px] text-slate-400 font-bold uppercase">${item.priceAtPurchase?.toFixed(2)} / unit</p>
										</div>
									</div>
								))}
							</div>

							{/* Payment Summary */}
							<div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4 shadow-xl">
								<div className="flex justify-between opacity-60 text-xs font-bold uppercase tracking-widest">
									<span>Subtotal</span>
									<span>${order.totalBasePrice?.toFixed(2)}</span>
								</div>
								<div className="flex justify-between opacity-60 text-xs font-bold uppercase tracking-widest">
									<span>Shipping Fee</span>
									<span>${order.shippingFee?.toFixed(2)}</span>
								</div>
								<div className="flex justify-between items-center pt-4 border-t border-slate-800">
									<span className="text-lg font-black uppercase text-slate-400">Total Paid</span>
									<span className="text-4xl font-black text-orange-500 tracking-tighter">
										${order.totalPayPrice?.toFixed(2)}
									</span>
								</div>
							</div>

							{/* Action Buttons: Only visible if status is PENDING or CONFIRMED */}
							{(order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PENDING') && (
								<button
									onClick={handleCancel}
									className="w-full mt-8 py-4 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest"
								>
									{isPayPalPaid ? 'Cancel Order & Refund' : 'Cancel Order'}
								</button>
							)}
						</div>
					)
				)}
			</div>
		</div>
	);
};

export default OrderDetailModal;
