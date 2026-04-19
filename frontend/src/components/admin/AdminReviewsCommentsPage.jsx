import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import {
    approveReview,
    getAdminReviews,
    getAdminReviewStats,
    rejectReview
} from '@/services/adminReviewApi';
import CommentTab from './CommentTab';

export default function AdminReviewsCommentsPage() {
    const [activeTab, setActiveTab] = useState('REVIEW');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [stats, setStats] = useState({
        totalReviews: 0,
        pendingCount: 0,
        approvedToday: 0,
        rejectedCount: 0
    });

    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'REVIEW') {
            fetchReviews();
        }
    }, [page, size, statusFilter, activeTab]);

    const fetchStats = async () => {
        try {
            const data = await getAdminReviewStats();

            setStats({
                totalReviews: data?.totalReviews ?? 0,
                pendingCount: data?.pendingCount ?? 0,
                approvedToday: data?.approvedToday ?? 0,
                rejectedCount: data?.rejectedCount ?? 0
            });
        } catch (error) {
            console.error('Failed to load review stats:', error);
            setStats({
                totalReviews: 0,
                pendingCount: 0,
                approvedToday: 0,
                rejectedCount: 0
            });
        }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);

            const data = await getAdminReviews({
                page,
                size,
                status: statusFilter
            });

            setReviews(Array.isArray(data?.content) ? data.content : []);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (error) {
            console.error('Failed to load admin reviews:', error);
            setReviews([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId) => {
        try {
            setActionLoadingId(reviewId);
            await approveReview(reviewId);
            await Promise.all([fetchStats(), fetchReviews()]);
        } catch (error) {
            console.error('Failed to approve review:', error);
            alert(error?.response?.data || 'Approve failed');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (reviewId) => {
        try {
            setActionLoadingId(reviewId);
            await rejectReview(reviewId);
            await Promise.all([fetchStats(), fetchReviews()]);
        } catch (error) {
            console.error('Failed to reject review:', error);
            alert(error?.response?.data || 'Reject failed');
        } finally {
            setActionLoadingId(null);
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.charAt(0) + status.slice(1).toLowerCase();
    };
    console.log('REVIEWS: ', reviews);
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className='rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700'>
                        Pending
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className='rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700'>
                        Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className='rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700'>
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className='rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-700'>
                        {formatStatus(status)}
                    </span>
                );
        }
    };

    const renderStars = (rating) => {
        const safeRating = Number(rating ?? 0);

        return (
            <div className='text-amber-500'>
                {'★'.repeat(safeRating)}
                <span className='text-gray-300'>{'★'.repeat(5 - safeRating)}</span>
            </div>
        );
    };

    const handleFilterChange = (status) => {
        setStatusFilter(status);
        setPage(0);
    };

    const startItem = totalElements === 0 ? 0 : page * size + 1;
    const endItem = Math.min((page + 1) * size, totalElements);

    return (
        <div className='flex min-h-screen bg-gray-100 text-gray-900'>
            <AdminSidebar />

            <main className='flex-1 p-8'>
                <div className='mb-10'>
                    <div className='mb-8 flex items-end justify-between'>
                        <div>
                            <h2 className='text-3xl font-extrabold tracking-tight'>
                                Moderation Center
                            </h2>
                            <p className='mt-1 text-gray-500'>
                                Reviewing user-generated content and feedback loops.
                            </p>
                        </div>

                        <div className='flex gap-2 rounded-xl bg-gray-100 p-1'>
                            <button
                                type='button'
                                onClick={() => setActiveTab('REVIEW')}
                                className={`rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all ${
                                    activeTab === 'REVIEW'
                                        ? 'bg-white text-blue-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                Review
                            </button>

                            <button
                                type='button'
                                onClick={() => setActiveTab('COMMENT')}
                                className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                                    activeTab === 'COMMENT'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-blue-600'
                                }`}
                            >
                                Comment
                            </button>
                        </div>
                    </div>

                    {activeTab === 'REVIEW' ? (
                        <>
                            <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
                                <div className='relative overflow-hidden rounded-xl bg-white p-6 shadow-sm'>
                                    <div className='absolute left-0 top-0 h-full w-1 bg-blue-600'></div>
                                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                                        Total Reviews
                                    </p>
                                    <div className='flex items-baseline gap-2'>
                                        <span className='text-4xl font-extrabold text-gray-900'>
                                            {stats.totalReviews}
                                        </span>
                                    </div>
                                </div>

                                <div className='relative overflow-hidden rounded-xl bg-white p-6 shadow-sm'>
                                    <div className='absolute left-0 top-0 h-full w-1 bg-orange-600'></div>
                                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                                        Pending Moderation
                                    </p>
                                    <div className='flex items-baseline gap-2'>
                                        <span className='text-4xl font-extrabold text-gray-900'>
                                            {stats.pendingCount}
                                        </span>
                                        <span className='text-xs font-bold text-orange-600'>
                                            Urgent
                                        </span>
                                    </div>
                                </div>

                                <div className='relative overflow-hidden rounded-xl bg-white p-6 shadow-sm'>
                                    <div className='absolute left-0 top-0 h-full w-1 bg-green-600'></div>
                                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                                        Approved Today
                                    </p>
                                    <div className='flex items-baseline gap-2'>
                                        <span className='text-4xl font-extrabold text-gray-900'>
                                            {stats.approvedToday}
                                        </span>
                                    </div>
                                </div>

                                <div className='relative overflow-hidden rounded-xl bg-white p-6 shadow-sm'>
                                    <div className='absolute left-0 top-0 h-full w-1 bg-red-600'></div>
                                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                                        Rejected Reviews
                                    </p>
                                    <div className='flex items-baseline gap-2'>
                                        <span className='text-4xl font-extrabold text-gray-900'>
                                            {stats.rejectedCount}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='mt-10 rounded-xl bg-white p-4 shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
                                <div className='mb-2 flex flex-wrap items-center justify-between gap-4 p-4'>
                                    <div className='flex items-center gap-6'>
                                        <button
                                            type='button'
                                            onClick={() => handleFilterChange('ALL')}
                                            className={`pb-1 text-sm transition-all ${
                                                statusFilter === 'ALL'
                                                    ? 'border-b-2 border-blue-600 font-bold text-blue-600'
                                                    : 'font-medium text-gray-500 hover:text-blue-600'
                                            }`}
                                        >
                                            All Reviews
                                        </button>

                                        <button
                                            type='button'
                                            onClick={() => handleFilterChange('PENDING')}
                                            className={`pb-1 text-sm transition-all ${
                                                statusFilter === 'PENDING'
                                                    ? 'border-b-2 border-blue-600 font-bold text-blue-600'
                                                    : 'font-medium text-gray-500 hover:text-blue-600'
                                            }`}
                                        >
                                            Pending
                                        </button>

                                        <button
                                            type='button'
                                            onClick={() => handleFilterChange('APPROVED')}
                                            className={`pb-1 text-sm transition-all ${
                                                statusFilter === 'APPROVED'
                                                    ? 'border-b-2 border-blue-600 font-bold text-blue-600'
                                                    : 'font-medium text-gray-500 hover:text-blue-600'
                                            }`}
                                        >
                                            Approved
                                        </button>

                                        <button
                                            type='button'
                                            onClick={() => handleFilterChange('REJECTED')}
                                            className={`pb-1 text-sm transition-all ${
                                                statusFilter === 'REJECTED'
                                                    ? 'border-b-2 border-blue-600 font-bold text-blue-600'
                                                    : 'font-medium text-gray-500 hover:text-blue-600'
                                            }`}
                                        >
                                            Rejected
                                        </button>
                                    </div>
                                </div>

                                <div className='overflow-x-auto'>
                                    <table className='w-full border-collapse text-left'>
                                        <thead>
                                            <tr className='bg-gray-50'>
                                                <th className='px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    Product
                                                </th>
                                                <th className='px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    User
                                                </th>
                                                <th className='px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    Rating
                                                </th>
                                                <th className='px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    Comment
                                                </th>
                                                <th className='px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    Status
                                                </th>
                                                <th className='px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className='divide-y divide-gray-200'>
                                            {loading ? (
                                                <tr>
                                                    <td
                                                        colSpan='6'
                                                        className='px-6 py-10 text-center text-sm text-gray-500'
                                                    >
                                                        Loading reviews...
                                                    </td>
                                                </tr>
                                            ) : reviews.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan='6'
                                                        className='px-6 py-10 text-center text-sm text-gray-500'
                                                    >
                                                        No reviews found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                reviews.map((review) => (
                                                    <tr
                                                        key={review.id}
                                                        className='transition-all hover:bg-gray-50'
                                                    >
                                                        <td className='px-6 py-5'>
                                                            <div className='flex items-center gap-3'>
                                                                {/* <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-200'>
                                                                    {review.productThumbnail ? (
                                                                        <img
                                                                            src={
                                                                                review.productThumbnail
                                                                            }
                                                                            alt={review.productName}
                                                                            className='h-full w-full object-cover'
                                                                        />
                                                                    ) : (
                                                                        <span className='text-xs font-bold text-gray-500'>
                                                                            IMG
                                                                        </span>
                                                                    )}
                                                                </div> */}
                                                                <div>
                                                                    <p className='text-sm font-bold text-gray-900'>
                                                                        {review.productName ||
                                                                            `Product #${review.productId}`}
                                                                    </p>
                                                                    <p className='text-[11px] text-gray-500'>
                                                                        ID: {review.productId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className='px-6 py-5'>
                                                            {review.user?.username ||
                                                                'Unknown user'}
                                                        </td>

                                                        <td className='px-6 py-5'>
                                                            {renderStars(review.ratingScore)}
                                                        </td>

                                                        <td className='max-w-xs px-6 py-5 text-sm text-gray-600'>
                                                            <p className='whitespace-normal break-words leading-6'>
                                                                {review.comment || 'No comment'}
                                                            </p>
                                                        </td>

                                                        <td className='px-6 py-5'>
                                                            {renderStatusBadge(review.status)}
                                                        </td>

                                                        <td className='px-6 py-5 text-right'>
                                                            {review.status === 'PENDING' ? (
                                                                <>
                                                                    <button
                                                                        type='button'
                                                                        disabled={
                                                                            actionLoadingId ===
                                                                            review.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleApprove(review.id)
                                                                        }
                                                                        className='mr-2 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700 hover:bg-green-200 disabled:opacity-50'
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        type='button'
                                                                        disabled={
                                                                            actionLoadingId ===
                                                                            review.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleReject(review.id)
                                                                        }
                                                                        className='rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200 disabled:opacity-50'
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            ) : review.status === 'APPROVED' ? (
                                                                <>
                                                                    <span className='mr-2 text-[11px] italic text-gray-500'>
                                                                        Approved
                                                                    </span>
                                                                    <button
                                                                        type='button'
                                                                        disabled={
                                                                            actionLoadingId ===
                                                                            review.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleReject(review.id)
                                                                        }
                                                                        className='rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200 disabled:opacity-50'
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type='button'
                                                                        disabled={
                                                                            actionLoadingId ===
                                                                            review.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleApprove(review.id)
                                                                        }
                                                                        className='mr-2 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700 hover:bg-green-200 disabled:opacity-50'
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <span className='text-[11px] italic text-gray-500'>
                                                                        Rejected
                                                                    </span>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className='flex items-center justify-between border-t border-gray-200 p-6'>
                                    <p className='text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                        Showing {startItem} to {endItem} of {totalElements} reviews
                                    </p>

                                    <div className='flex gap-2'>
                                        <button
                                            type='button'
                                            disabled={page === 0}
                                            onClick={() => setPage((prev) => prev - 1)}
                                            className='rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                                        >
                                            <span className='material-symbols-outlined'>
                                                chevron_left
                                            </span>
                                        </button>

                                        <button className='rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white'>
                                            {page + 1}
                                        </button>

                                        <button
                                            type='button'
                                            disabled={page + 1 >= totalPages}
                                            onClick={() => setPage((prev) => prev + 1)}
                                            className='rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                                        >
                                            <span className='material-symbols-outlined'>
                                                chevron_right
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CommentTab />
                    )}
                </div>
            </main>
        </div>
    );
}
