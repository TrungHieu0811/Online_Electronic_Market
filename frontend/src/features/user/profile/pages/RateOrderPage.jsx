import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OrderReviewHeader from '../components/OrderReviewHeader';
import ReviewProductCard from '../components/ReviewProductCard';
import { getOrderForReview, submitOrderReviews } from '../../../../services/orderReviewApi';

export default function RateOrderPage() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [reviews, setReviews] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getOrderForReview(orderId);
                setOrder(data);

                const initialReviews = {};
                data.items.forEach((item) => {
                    initialReviews[item.id] = {
                        rating: 0,
                        comment: ''
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

    const handleRatingChange = (itemId, rating) => {
        setReviews((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                rating
            }
        }));
    };

    const handleCommentChange = (itemId, comment) => {
        setReviews((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                comment
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!order || order.items.length === 0) return;

        const payload = {
            reviews: order.items.map((item) => ({
                orderItemId: item.id,
                productId: item.productId,
                rating: reviews[item.id]?.rating || 0,
                comment: reviews[item.id]?.comment || ''
            }))
        };

        const hasInvalidRating = payload.reviews.some((r) => r.rating < 1 || r.rating > 5);
        if (hasInvalidRating) {
            alert('Vui lòng chọn số sao cho tất cả sản phẩm.');
            return;
        }

        try {
            setSubmitting(true);
            await submitOrderReviews(orderId, payload);
            alert('Gửi đánh giá thành công!');
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.error || 'Gửi đánh giá thất bại!');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className='p-10 text-lg'>Loading...</div>;
    }

    if (error) {
        return <div className='p-10 text-red-500'>{error}</div>;
    }

    if (!order) {
        return <div className='p-10'>Không có dữ liệu đơn hàng.</div>;
    }

    return (
        <main className='mx-auto max-w-4xl px-6 pb-24 pt-32'>
            <OrderReviewHeader orderId={order.orderId} status={order.status} />

            {order.items.length === 0 ? (
                <div className='rounded-2xl bg-white p-8 text-center shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
                    <h2 className='mb-2 text-2xl font-bold text-slate-900'>
                        Không còn sản phẩm cần đánh giá
                    </h2>
                    <p className='text-slate-600'>Đơn hàng này đã được đánh giá hết rồi.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {order.items.map((item) => (
                        <ReviewProductCard
                            key={item.id}
                            item={item}
                            review={reviews[item.id]}
                            onRatingChange={handleRatingChange}
                            onCommentChange={handleCommentChange}
                        />
                    ))}

                    <div className='flex justify-center'>
                        <button
                            type='submit'
                            disabled={submitting}
                            className='min-w-[320px] rounded-2xl bg-gradient-to-br from-[#003f87] to-[#0056b3] px-12 py-5 text-lg font-bold text-white shadow-[0px_8px_24px_rgba(0,86,179,0.3)] transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            {submitting ? 'Submitting...' : 'Submit All Reviews'}
                        </button>
                    </div>
                </form>
            )}
        </main>
    );
}
