import React, { useEffect, useMemo, useState } from 'react';
import {
    getAdminCommentsByProduct,
    markAdminCommentsAsRead,
    replyAdminComment
} from '@/services/adminCommentApi';

export default function CommentDetailModal({ group, onClose, onReplied }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [replyingParentId, setReplyingParentId] = useState(null);
    const [sending, setSending] = useState(false);
    const buildImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:8080/uploads${path}`;
    };

    useEffect(() => {
        if (group?.productId) {
            fetchComments();
            handleMarkAsRead();
        }
    }, [group?.productId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await getAdminCommentsByProduct(group.productId);
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load comments by product:', error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async () => {
        try {
            await markAdminCommentsAsRead(group.productId);
            await onReplied?.();
        } catch (error) {
            console.error('Failed to mark comments as read:', error);
        }
    };

    const handleSendReply = async () => {
        const trimmed = replyContent.trim();

        if (!trimmed) {
            alert('Please enter reply content');
            return;
        }

        if (!replyingParentId) {
            alert('Please choose a parent comment to reply');
            return;
        }

        try {
            setSending(true);

            await replyAdminComment({
                productId: group.productId,
                parentId: replyingParentId,
                content: trimmed
            });

            setReplyContent('');
            setReplyingParentId(null);

            await fetchComments();
            await onReplied?.();
        } catch (error) {
            console.error('Failed to reply comment:', error);
            alert(error?.response?.data || 'Reply failed');
        } finally {
            setSending(false);
        }
    };

    const flattenedComments = useMemo(() => {
        const result = [];

        const walk = (items, level = 0) => {
            if (!Array.isArray(items)) return;

            items.forEach((item) => {
                result.push({
                    ...item,
                    level
                });

                if (Array.isArray(item.replies) && item.replies.length > 0) {
                    walk(item.replies, level + 1);
                }
            });
        };

        walk(comments, 0);
        return result;
    }, [comments]);

    const commentCount = useMemo(() => flattenedComments.length, [flattenedComments]);

    const formatDate = (value) => {
        if (!value) return '---';

        try {
            return new Date(value).toLocaleString('vi-VN');
        } catch {
            return value;
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
                <div className='flex items-start justify-between border-b border-gray-200 bg-gray-50 p-6'>
                    <div className='flex items-start gap-4'>
                        <div className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-gray-200'>
                            {group?.productThumbnail ? (
                                <img
                                    src={buildImageUrl(group.productThumbnail)}
                                    alt={group.productName || 'Product'}
                                    className='h-full w-full object-cover'
                                />
                            ) : (
                                <span className='text-xs font-bold text-gray-500'>IMG</span>
                            )}
                        </div>

                        <div>
                            <p className='mb-1 text-xs font-bold uppercase tracking-widest text-gray-500'>
                                {group?.categoryName || 'Category'}
                            </p>

                            <h2 className='text-xl font-extrabold text-gray-900'>
                                {group?.productName || `Product #${group?.productId}`}
                            </h2>

                            <div className='mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                                <span>Product ID: {group?.productId}</span>
                                <span>Comments: {commentCount}</span>
                                <span>
                                    New:{' '}
                                    {Number(group?.newCommentsCount ?? group?.newCommentCount ?? 0)}
                                </span>
                            </div>

                            {group?.latestCommentPreview && (
                                <p className='mt-3 max-w-2xl text-sm italic text-gray-600'>
                                    "{group.latestCommentPreview}"
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-full p-2 text-gray-500 transition hover:bg-gray-200'
                    >
                        <span className='material-symbols-outlined'>close</span>
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto bg-gray-50 p-6'>
                    {loading ? (
                        <div className='rounded-xl bg-white p-10 text-center text-sm text-gray-500'>
                            Loading comment thread...
                        </div>
                    ) : flattenedComments.length === 0 ? (
                        <div className='rounded-xl bg-white p-10 text-center text-sm text-gray-500'>
                            No comments found.
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {flattenedComments.map((comment) => {
                                const isAdminReply =
                                    comment?.isAdminReply === true || comment?.adminReply === true;

                                const level = comment?.level ?? 0;

                                return (
                                    <div
                                        key={comment.id}
                                        className='flex justify-start'
                                        style={{
                                            marginLeft: `${level * 32}px`
                                        }}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                                                isAdminReply
                                                    ? 'border border-blue-200 bg-blue-50 text-gray-900'
                                                    : 'bg-white text-gray-900'
                                            }`}
                                        >
                                            <div className='mb-2 flex items-center gap-2 text-xs'>
                                                <span className='font-bold'>
                                                    {comment?.user?.username ||
                                                        comment?.username ||
                                                        (isAdminReply ? 'Admin' : 'User')}
                                                </span>

                                                {isAdminReply && (
                                                    <span className='rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700'>
                                                        Admin
                                                    </span>
                                                )}

                                                <span className='text-gray-400'>
                                                    {formatDate(
                                                        comment?.createdAt || comment?.timeAgo
                                                    )}
                                                </span>
                                            </div>

                                            <p className='whitespace-pre-wrap break-words text-sm leading-6'>
                                                {comment?.content || 'No content'}
                                            </p>

                                            {!isAdminReply && (
                                                <div className='mt-3'>
                                                    <button
                                                        type='button'
                                                        onClick={() => {
                                                            setReplyingParentId(comment.id);
                                                            setReplyContent('');
                                                        }}
                                                        className='text-xs font-bold text-blue-600 hover:underline'
                                                    >
                                                        Reply to this comment
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className='border-t border-gray-200 bg-white p-6'>
                    <div className='mb-3 flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-bold text-gray-900'>Admin Reply</p>
                            <p className='text-xs text-gray-500'>
                                {replyingParentId
                                    ? `Replying to comment ID: ${replyingParentId}`
                                    : 'Select a user comment above to reply'}
                            </p>
                        </div>

                        {replyingParentId && (
                            <button
                                type='button'
                                onClick={() => setReplyingParentId(null)}
                                className='text-xs font-bold text-red-500 hover:underline'
                            >
                                Clear parent
                            </button>
                        )}
                    </div>

                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={4}
                        placeholder='Write your reply...'
                        className='w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition focus:border-blue-500'
                    />

                    <div className='mt-4 flex justify-end gap-3'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100'
                        >
                            Close
                        </button>

                        <button
                            type='button'
                            onClick={handleSendReply}
                            disabled={sending}
                            className='rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50'
                        >
                            {sending ? 'Sending...' : 'Reply'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
