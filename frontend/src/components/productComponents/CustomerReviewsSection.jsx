import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { getProductReviews, getReviewSummary } from '@/services/reviewapi';

const DEFAULT_VISIBLE_REVIEWS = 2;

function ReviewStars({ count = 5, size = 14 }) {
    return (
        <div className='flex items-center gap-0.5 text-amber-400'>
            {Array.from({ length: 5 }).map((_, index) => {
                const currentStar = index + 1;
                const active = currentStar <= count;

                return (
                    <FontAwesomeIcon
                        key={index}
                        icon={faStar}
                        style={{
                            fontSize: size,
                            opacity: active ? 1 : 0.15
                        }}
                    />
                );
            })}
        </div>
    );
}

function RatingBar({ label, percent, active = false, onClick }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={`flex w-full items-center gap-4 rounded-lg px-2 py-1 text-sm transition ${
                active ? 'bg-amber-50' : 'hover:bg-gray-50'
            }`}
        >
            <span className='w-12 text-left text-gray-700'>{label}</span>
            <div className='h-2 flex-1 rounded-full bg-gray-200'>
                <div className='h-2 rounded-full bg-amber-400' style={{ width: `${percent}%` }} />
            </div>
            <span className='w-10 text-right text-gray-600'>{percent}%</span>
        </button>
    );
}

function getSentimentBadgeClass(sentiment) {
    switch (sentiment) {
        case 'POSITIVE':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'NEGATIVE':
            return 'bg-red-50 text-red-700 border-red-200';
        default:
            return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
}

function ReviewItem({ name, rating = 5, date, content, sentiment, sentimentExplanation }) {
    return (
        <div className='border-b border-gray-200 pb-6 last:border-b-0'>
            <div className='mb-2 flex items-start justify-between gap-4'>
                <div>
                    <h4 className='font-bold text-gray-900'>{name}</h4>
                    <ReviewStars count={rating} size={13} />
                </div>

                <span className='text-xs text-gray-400'>{date}</span>
            </div>

            <p className='italic leading-relaxed text-gray-600'>{content}</p>

            {sentiment && (
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                    <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getSentimentBadgeClass(
                            sentiment
                        )}`}
                    >
                        {sentiment}
                    </span>
                </div>
            )}

            {sentimentExplanation && (
                <p className='mt-2 text-xs leading-relaxed text-gray-500'>
                    AI insight: {sentimentExplanation}
                </p>
            )}
        </div>
    );
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
}

export default function CustomerReviewsSection({ productId, onSummaryFetched }) {
    const [summary, setSummary] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStar, setSelectedStar] = useState(0);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const fetchReviewData = async () => {
            if (!productId) return;

            try {
                setLoading(true);

                const [summaryData, reviewsData] = await Promise.all([
                    getReviewSummary(productId),
                    getProductReviews(productId)
                ]);

                setSummary(summaryData);
                setReviews(Array.isArray(reviewsData) ? reviewsData : []);

                // 👉 THÊM ĐOẠN NÀY: Truyền điểm rating thực tế lên component cha
                if (onSummaryFetched && summaryData) {
                    onSummaryFetched(summaryData.averageRating ?? 0);
                }

            } catch (error) {
                console.error('Error loading review section:', error);
                setSummary(null);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewData();
    }, [productId]); // Xóa onSummaryFetched khỏi dependency array để tránh loop

    useEffect(() => {
        setExpanded(false);
    }, [selectedStar, productId]);

    const filteredReviews = useMemo(() => {
        if (!selectedStar) return reviews;
        return reviews.filter((item) => Number(item.ratingScore) === Number(selectedStar));
    }, [reviews, selectedStar]);

    const visibleReviews = expanded
        ? filteredReviews
        : filteredReviews.slice(0, DEFAULT_VISIBLE_REVIEWS);

    const remainingReviews = Math.max(filteredReviews.length - DEFAULT_VISIBLE_REVIEWS, 0);

    if (loading) {
        return (
            <section className='mb-12'>
                <h2 className='mb-8 border-b pb-4 text-2xl font-bold text-gray-900'>
                    Customer Reviews
                </h2>
                <div className='rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500'>
                    Loading reviews...
                </div>
            </section>
        );
    }

    const averageRating = summary?.averageRating ?? 0;
    const totalReviews = summary?.totalReviews ?? 0;

    return (
        <section className='mb-12'>
            <div className='mb-8 flex items-center justify-between gap-4 border-b pb-4'>
                <h2 className='text-2xl font-bold text-gray-900'>Customer Reviews</h2>

                {selectedStar > 0 && (
                    <button
                        type='button'
                        onClick={() => setSelectedStar(0)}
                        className='rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            <div className='grid grid-cols-1 gap-12 lg:grid-cols-3'>
                <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                        <span className='text-5xl font-extrabold text-gray-900'>
                            {Number(averageRating).toFixed(1)}
                        </span>

                        <div>
                            <ReviewStars count={Math.round(averageRating)} size={16} />
                            <p className='mt-1 text-sm text-gray-500'>
                                Based on {totalReviews} reviews
                            </p>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <RatingBar
                            label='5 Star'
                            percent={summary?.fiveStarPercent ?? 0}
                            active={selectedStar === 5}
                            onClick={() => setSelectedStar((prev) => (prev === 5 ? 0 : 5))}
                        />
                        <RatingBar
                            label='4 Star'
                            percent={summary?.fourStarPercent ?? 0}
                            active={selectedStar === 4}
                            onClick={() => setSelectedStar((prev) => (prev === 4 ? 0 : 4))}
                        />
                        <RatingBar
                            label='3 Star'
                            percent={summary?.threeStarPercent ?? 0}
                            active={selectedStar === 3}
                            onClick={() => setSelectedStar((prev) => (prev === 3 ? 0 : 3))}
                        />
                        <RatingBar
                            label='2 Star'
                            percent={summary?.twoStarPercent ?? 0}
                            active={selectedStar === 2}
                            onClick={() => setSelectedStar((prev) => (prev === 2 ? 0 : 2))}
                        />
                        <RatingBar
                            label='1 Star'
                            percent={summary?.oneStarPercent ?? 0}
                            active={selectedStar === 1}
                            onClick={() => setSelectedStar((prev) => (prev === 1 ? 0 : 1))}
                        />
                    </div>
                </div>

                <div className='space-y-8 lg:col-span-2'>
                    {filteredReviews.length === 0 ? (
                        <div className='rounded-2xl border border-gray-200 bg-white p-6 text-gray-500'>
                            No reviews found.
                        </div>
                    ) : (
                        <>
                            {visibleReviews.map((item) => (
                                <ReviewItem
                                    key={item.id}
                                    name={item.user?.username || 'Unknown User'}
                                    rating={item.ratingScore || 0}
                                    date={formatDate(item.createdAt)}
                                    content={item.comment || 'No review content.'}
                                    sentiment={item.sentiment}
                                    sentimentExplanation={item.sentimentExplanation}
                                />
                            ))}

                            {filteredReviews.length > DEFAULT_VISIBLE_REVIEWS && (
                                <div className='flex justify-center gap-3 pt-2'>
                                    {!expanded ? (
                                        <button
                                            type='button'
                                            onClick={() => setExpanded(true)}
                                            className='rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100'
                                        >
                                            Show {remainingReviews} More Review
                                            {remainingReviews > 1 ? 's' : ''}
                                        </button>
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => setExpanded(false)}
                                            className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
                                        >
                                            Collapse
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
