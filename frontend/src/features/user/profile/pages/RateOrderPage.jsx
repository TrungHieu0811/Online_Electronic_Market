import {useEffect, useMemo, useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import OrderReviewHeader from '../components/OrderReviewHeader';
import ReviewProductCard from '../components/ReviewProductCard';
import {getOrderForReview, submitOrderReviews} from '../../../../services/orderReviewApi';

export default function RateOrderPage() {
	const {orderId} = useParams();
	const location = useLocation();

	const passedOrder = location.state?.order || null;

	const [order, setOrder] = useState(null);
	const [reviews, setReviews] = useState({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const BASE_IMAGE_URL = 'http://localhost:8080/uploads';
	useEffect(() => {
		const fetchOrder = async () => {
			try {
				setLoading(true);
				setError('');

				const data = await getOrderForReview(orderId);
				setOrder(data);

				const initialReviews = {};
				const apiItems = Array.isArray(data?.items) ? data.items : [];

				apiItems.forEach((item) => {
					initialReviews[item.id] = {
						rating: 0,
						comment: '',
					};
				});

				setReviews(initialReviews);
			} catch (err) {
				console.error(err);
				setError(err?.response?.data?.error || 'Failed to load order review data');
			} finally {
				setLoading(false);
			}
		};

		if (orderId) {
			fetchOrder();
		}
	}, [orderId]);

	const fallbackItems = useMemo(() => {
		if (!passedOrder) return [];

		const sourceItems = passedOrder.orderItems || passedOrder.items || [];

		return sourceItems.map((item, index) => ({
			id: item.id ?? index,
			productId: item.product?.id ?? item.productId ?? null,
			productName: item.product?.variantName || item.product?.name || item.productName || `Product ${index + 1}`,
			price: item.priceAtPurchase ?? item.price_at_purchase ?? item.product?.salePrice ?? item.price ?? 0,
			imageUrl: item.product?.thumbnailUrl || item.product?.imageUrl || item.imageUrl || null,
		}));
	}, [passedOrder]);

	const reviewableItems = Array.isArray(order?.items) ? order.items : [];
	const hasReviewableItems = reviewableItems.length > 0;
	const hasFallbackItems = fallbackItems.length > 0;

	const handleRatingChange = (itemId, rating) => {
		setReviews((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				rating,
			},
		}));
	};

	const handleCommentChange = (itemId, comment) => {
		setReviews((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				comment,
			},
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!order || reviewableItems.length === 0) return;

		const payload = {
			reviews: reviewableItems.map((item) => ({
				orderItemId: item.id,
				productId: item.productId,
				image: item.product?.thumbnailUrl || item.product?.imageUrl || null,
				rating: reviews[item.id]?.rating || 0,
				comment: reviews[item.id]?.comment || '',
			})),
		};

		const hasInvalidRating = payload.reviews.some((r) => r.rating < 1 || r.rating > 5);
		if (hasInvalidRating) {
			alert('Please select a rating for all products.');
			return;
		}

		try {
			setSubmitting(true);
			await submitOrderReviews(orderId, payload);
			alert('Reviews submitted successfully!');
		} catch (err) {
			console.error(err);
			alert(err?.response?.data?.error || 'Failed to submit reviews!');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="p-10 text-lg">Loading...</div>;
	}

	if (error) {
		return <div className="p-10 text-red-500">{error}</div>;
	}

	if (!order) {
		return <div className="p-10">No order data available.</div>;
	}

	return (
		<main className="mx-auto max-w-4xl px-6 pb-10 pt-14">
			<OrderReviewHeader orderId={order.orderId} status={order.status} />

			{hasReviewableItems ? (
				<form onSubmit={handleSubmit}>
					{reviewableItems.map((item) => (
						<ReviewProductCard
							key={item.id}
							item={item}
							review={reviews[item.id]}
							onRatingChange={handleRatingChange}
							onCommentChange={handleCommentChange}
						/>
					))}

					<div className="flex justify-center">
						<button
							type="submit"
							disabled={submitting}
							className="min-w-[320px] rounded-2xl bg-gradient-to-br from-[#003f87] to-[#0056b3] px-12 py-5 text-lg font-bold text-white shadow-[0px_8px_24px_rgba(0,86,179,0.3)] transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting ? 'Submitting...' : 'Submit All Reviews'}
						</button>
					</div>
				</form>
			) : hasFallbackItems ? (
				<div className="space-y-6">
					<div className="rounded-2xl bg-white p-8 text-center shadow-[0px_12px_32px_rgba(0,26,64,0.08)]">
						<h2 className="mb-2 text-2xl font-bold text-slate-900">Reviewed items</h2>
						<p className="text-slate-600">This order has already been reviewed. Here are the products from that order.</p>
					</div>

					<div className="space-y-4">
						{fallbackItems.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0px_12px_32px_rgba(0,26,64,0.08)]"
							>
								<div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
									{item.imageUrl ? (
										<img
											src={item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE_IMAGE_URL + item.imageUrl}`}
											alt={item.productName}
											className="h-full w-full object-cover"
										/>
									) : (
										<span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
									)}
								</div>

								<div className="min-w-0 flex-1">
									<h3 className="truncate text-lg font-bold text-slate-900">{item.productName}</h3>
									<p className="mt-1 text-sm text-slate-500">Product ID: {item.productId ?? 'N/A'}</p>
									<p className="mt-1 font-semibold text-slate-900">
										{new Intl.NumberFormat('en-US', {
											style: 'currency',
											currency: 'USD',
										}).format(Number(item.price ?? 0))}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-2xl bg-white p-8 text-center shadow-[0px_12px_32px_rgba(0,26,64,0.08)]">
					<h2 className="mb-2 text-2xl font-bold text-slate-900">No items to review</h2>
					<p className="text-slate-600">This order has already been reviewed. Thank you.</p>
				</div>
			)}
		</main>
	);
}
