import React, { useEffect, useMemo, useState } from 'react';
import CommentDetailModal from './CommentDetailModal';
import { getAdminCommentProducts } from '@/services/adminCommentApi';

export default function CommentTab() {
    const [stats, setStats] = useState({
        unresolvedCount: 0,
        newCommentsCount: 0,
        readCount: 0
    });

    const [groups, setGroups] = useState([]);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        fetchGroups();
    }, [page, size]);

    const getUnreadCount = (item) => {
        return Number(item?.newCommentsCount ?? item?.newCommentCount ?? 0);
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);

            const data = await getAdminCommentProducts({ page, size });
            // console.log('getAdminCommentProducts response:', data);

            const content = Array.isArray(data?.content) ? data.content : [];
            const totalPagesValue = data?.totalPages ?? 0;
            const totalElementsValue = data?.totalElements ?? 0;

            setGroups(content);
            setTotalPages(totalPagesValue);
            setTotalElements(totalElementsValue);

            const unresolvedCount = content.filter((item) => getUnreadCount(item) > 0).length;

            const newCommentsCount = content.reduce((sum, item) => sum + getUnreadCount(item), 0);

            const readCount = content.filter((item) => getUnreadCount(item) === 0).length;

            setStats({
                unresolvedCount,
                newCommentsCount,
                readCount
            });
        } catch (error) {
            console.error('Failed to load comment products:', error);
            console.error('Error response:', error?.response?.data);

            setGroups([]);
            setTotalPages(0);
            setTotalElements(0);
            setStats({
                unresolvedCount: 0,
                newCommentsCount: 0,
                readCount: 0
            });
        } finally {
            setLoading(false);
        }
    };
console.log("groups: ",groups);
    const startItem = useMemo(() => {
        if (totalElements === 0) return 0;
        return page * size + 1;
    }, [page, size, totalElements]);

    const endItem = useMemo(() => {
        return Math.min((page + 1) * size, totalElements);
    }, [page, size, totalElements]);

    return (
        <>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <div className='relative overflow-hidden rounded-xl bg-white p-6 shadow-sm'>
                    <div className='absolute left-0 top-0 h-full w-1 bg-blue-600'></div>
                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                        Unresolved Alerts
                    </p>
                    <div className='flex items-baseline gap-2'>
                        <span className='text-4xl font-extrabold text-gray-900'>
                            {stats.unresolvedCount}
                        </span>
                        <span className='text-xs font-bold text-orange-600'>Need reply</span>
                    </div>
                </div>

                <div className='rounded-xl bg-white p-6 shadow-sm'>
                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                        New Comments
                    </p>
                    <span className='text-4xl font-extrabold text-gray-900'>
                        {stats.newCommentsCount}
                    </span>
                </div>

                <div className='rounded-xl bg-white p-6 shadow-sm'>
                    <p className='mb-2 text-xs font-bold uppercase tracking-widest text-gray-500'>
                        Read Threads
                    </p>
                    <span className='text-4xl font-extrabold text-gray-900'>{stats.readCount}</span>
                </div>
            </div>

            <div className='mt-10 overflow-hidden rounded-xl bg-white shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
                <div className='overflow-x-auto'>
                    <table className='w-full border-collapse text-left'>
                        <thead>
                            <tr className='bg-gray-50'>
                                <th className='px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    Product
                                </th>
                                <th className='px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    Category
                                </th>
                                <th className='px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    New Comments
                                </th>
                                <th className='px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    Latest Preview
                                </th>
                                <th className='px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    Time
                                </th>
                                <th className='px-8 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                                    Action
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
                                        Loading comments...
                                    </td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan='6'
                                        className='px-6 py-10 text-center text-sm text-gray-500'
                                    >
                                        No comment groups found.
                                    </td>
                                </tr>
                            ) : (
                                groups.map((group, index) => {
                                    const unreadCount = getUnreadCount(group);

                                    return (
                                        <tr
                                            key={group.productId ?? index}
                                            className='transition-all hover:bg-gray-50'
                                        >
                                            <td className='px-8 py-6'>
                                                <div className='flex items-center gap-4'>
                                                    <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-200'>
                                                        {group.productThumbnail ? (
                                                            <img
                                                                src={group.productThumbnail.startsWith('http') ? group.productThumbnail : `${'http://localhost:8080/uploads'+group.productThumbnail}`}
                                                                alt={group.productName || 'Product'}
                                                                className='h-full w-full object-cover'
                                                            />
                                                        ) : (
                                                            <span className='text-xs font-bold text-gray-500'>
                                                                IMG
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className='text-sm font-bold text-gray-900'>
                                                            {group.productName ||
                                                                `Product #${group.productId}`}
                                                        </p>
                                                        <p className='text-[11px] text-gray-500'>
                                                            ID: {group.productId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className='px-6 py-6'>
                                                <span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700'>
                                                    {group.categoryName || 'Uncategorized'}
                                                </span>
                                            </td>

                                            <td className='px-6 py-6'>
                                                <div className='flex items-center gap-2'>
                                                    <span
                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                                                            unreadCount > 0
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                    >
                                                        {unreadCount}
                                                    </span>

                                                    <span
                                                        className={`text-sm font-medium ${
                                                            unreadCount > 0
                                                                ? 'text-orange-600'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {unreadCount > 0 ? 'New' : 'Read'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className='max-w-xs px-6 py-6 text-sm text-gray-600'>
                                                <p className='truncate italic'>
                                                    {group.latestCommentPreview || 'No preview'}
                                                </p>
                                            </td>

                                            <td className='px-6 py-6 text-xs font-medium text-gray-500'>
                                                {group.latestCommentTimeAgo ||
                                                    group.latestCommentAt ||
                                                    '---'}
                                            </td>

                                            <td className='px-8 py-6 text-right'>
                                                <button
                                                    type='button'
                                                    onClick={() => setSelectedGroup(group)}
                                                    className='rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-blue-600 hover:text-white'
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex items-center justify-between border-t border-gray-200 p-6'>
                    <p className='text-[11px] font-bold uppercase tracking-widest text-gray-500'>
                        Showing {startItem} to {endItem} of {totalElements} moderation groups
                    </p>

                    <div className='flex gap-2'>
                        <button
                            type='button'
                            disabled={page === 0}
                            onClick={() => setPage((prev) => prev - 1)}
                            className='rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            <span className='material-symbols-outlined'>chevron_left</span>
                        </button>

                        <button
                            type='button'
                            className='rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white'
                        >
                            {page + 1}
                        </button>

                        <button
                            type='button'
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                            className='rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            <span className='material-symbols-outlined'>chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {selectedGroup && (
                <CommentDetailModal
                    group={selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                    onReplied={async () => {
                        await fetchGroups();
                    }}
                />
            )}
        </>
    );
}
