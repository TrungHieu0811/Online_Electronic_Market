import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const DEFAULT_VISIBLE_COMMENTS = 2;
const LOAD_MORE_COMMENTS_STEP = 2;
const DEFAULT_VISIBLE_REPLIES = 2;

function ReplyItem({ reply, level = 1, focusCommentId = null }) {
    const childReplies = Array.isArray(reply?.replies) ? reply.replies : [];
    const hasManyReplies = childReplies.length > DEFAULT_VISIBLE_REPLIES;

    const [expanded, setExpanded] = useState(false);

    const visibleReplies = expanded ? childReplies : childReplies.slice(0, DEFAULT_VISIBLE_REPLIES);

    const isFocusedReply = String(reply?.id) === String(focusCommentId);

    return (
        <div
            id={`comment-${reply?.id}`}
            className={`relative rounded-xl transition-all ${
                isFocusedReply ? 'bg-blue-50/60 ring-2 ring-blue-200' : ''
            }`}
            style={{
                marginLeft: `${Math.min(level - 1, 4) * 24}px`
            }}
        >
            <div className='absolute -left-[21px] top-3 h-[2px] w-4 bg-gray-100'></div>

            <div className='flex items-start gap-3'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
                    <svg className='h-4 w-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z'></path>
                    </svg>
                </div>

                <div className='w-full'>
                    <div className='mb-1 flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-bold text-gray-900'>
                            {reply.user?.username}
                        </span>

                        {reply.isAdminReply && (
                            <span className='rounded bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-600'>
                                Admin
                            </span>
                        )}

                        <span className='text-[10px] text-gray-400'>
                            {new Date(reply.createdAt).toLocaleString()}
                        </span>
                    </div>

                    <p className='break-words whitespace-pre-wrap text-sm leading-relaxed text-gray-600'>
                        {reply.content}
                    </p>

                    {childReplies.length > 0 && (
                        <div className='mt-4 space-y-4 border-l-2 border-gray-100 pl-4'>
                            {visibleReplies.map((childReply) => (
                                <ReplyItem
                                    key={childReply.id}
                                    reply={childReply}
                                    level={level + 1}
                                    focusCommentId={focusCommentId}
                                />
                            ))}

                            {hasManyReplies && (
                                <button
                                    type='button'
                                    onClick={() => setExpanded((prev) => !prev)}
                                    className='text-xs font-bold text-blue-600 hover:underline'
                                >
                                    {expanded
                                        ? 'Thu gọn'
                                        : `Xem thêm ${childReplies.length - DEFAULT_VISIBLE_REPLIES} phản hồi`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function QuestionAnswerSection({ productId, focusCommentId = null }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newQuestion, setNewQuestion] = useState('');
    const [replyingCommentId, setReplyingCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const [popup, setPopup] = useState({
        show: false,
        message: '',
        type: 'error'
    });

    const [expandedRootComments, setExpandedRootComments] = useState({});
    const [visibleCommentsCount, setVisibleCommentsCount] = useState(DEFAULT_VISIBLE_COMMENTS);

    const getToken = () => localStorage.getItem('token');

    const currentUsername = useMemo(() => {
        const token = getToken();
        if (!token) return null;

        try {
            const payloadBase64 = token.split('.')[1];
            const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);

            return payload?.sub || payload?.username || null;
        } catch (error) {
            console.error('Cannot decode token:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        fetchComments();
    }, [productId]);

    useEffect(() => {
        if (!focusCommentId || comments.length === 0) return;

        const findCommentPath = (items, targetId, path = []) => {
            for (const item of items) {
                const nextPath = [...path, item.id];

                if (String(item.id) === String(targetId)) {
                    return nextPath;
                }

                if (Array.isArray(item.replies) && item.replies.length > 0) {
                    const found = findCommentPath(item.replies, targetId, nextPath);
                    if (found) return found;
                }
            }
            return null;
        };

        const path = findCommentPath(comments, focusCommentId);

        if (path && path.length > 0) {
            const rootId = path[0];

            const rootIndex = comments.findIndex((item) => String(item.id) === String(rootId));

            if (rootIndex >= 0) {
                setVisibleCommentsCount((prev) => Math.max(prev, rootIndex + 1));
            }

            setExpandedRootComments((prev) => ({
                ...prev,
                [rootId]: true
            }));
        }

        const timer = setTimeout(() => {
            const el = document.getElementById(`comment-${focusCommentId}`);
            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [focusCommentId, comments]);

    const showPopup = (message, type = 'error') => {
        setPopup({ show: true, message, type });

        setTimeout(() => {
            setPopup({ show: false, message: '', type: 'error' });
        }, 2500);
    };

    const getAuthConfig = () => {
        const token = getToken();

        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const getErrorMessage = (error) => {
        const status = error?.response?.status;
        const data = error?.response?.data;

        if (status === 401) return 'Bạn chưa đăng nhập';
        if (status === 403) return 'Bạn không có quyền thực hiện thao tác này';

        if (typeof data === 'string' && data.trim()) return data;
        if (data?.error) return data.error;
        if (data?.message) return data.message;

        return 'Có lỗi xảy ra, vui lòng thử lại';
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8080/api/comments/product/${productId}`);

            setComments(Array.isArray(res.data) ? res.data : []);
            setVisibleCommentsCount(DEFAULT_VISIBLE_COMMENTS);
            setExpandedRootComments({});
        } catch (error) {
            console.error('Error fetching comments:', error);
            showPopup('Không tải được danh sách bình luận');
        } finally {
            setLoading(false);
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestion.trim()) {
            showPopup('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        if (!getToken()) {
            showPopup('Bạn cần đăng nhập để đặt câu hỏi');
            return;
        }

        try {
            await axios.post(
                'http://localhost:8080/api/comments',
                {
                    content: newQuestion,
                    productId: productId
                },
                getAuthConfig()
            );

            setNewQuestion('');
            await fetchComments();
            showPopup('Đăng câu hỏi thành công', 'success');
        } catch (error) {
            console.error('Error posting question:', error);
            showPopup(getErrorMessage(error));
        }
    };

    const handleOpenReplyBox = (commentId) => {
        if (replyingCommentId === commentId) {
            setReplyingCommentId(null);
            setReplyContent('');
            return;
        }

        setReplyingCommentId(commentId);
        setReplyContent('');
    };

    const handlePostReply = async (parentId) => {
        if (!replyContent.trim()) {
            showPopup('Vui lòng nhập nội dung phản hồi');
            return;
        }

        if (!getToken()) {
            showPopup('Bạn cần đăng nhập để phản hồi');
            return;
        }

        try {
            await axios.post(
                'http://localhost:8080/api/comments',
                {
                    content: replyContent,
                    productId: productId,
                    parentId: parentId
                },
                getAuthConfig()
            );

            setReplyContent('');
            setReplyingCommentId(null);
            await fetchComments();
            showPopup('Gửi phản hồi thành công', 'success');
        } catch (error) {
            console.error('Error posting reply:', error);
            showPopup(getErrorMessage(error));
        }
    };

    const toggleRootReplies = (commentId) => {
        setExpandedRootComments((prev) => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const handleLoadMoreComments = () => {
        setVisibleCommentsCount((prev) =>
            Math.min(prev + LOAD_MORE_COMMENTS_STEP, comments.length)
        );
    };

    const visibleComments = comments.slice(0, visibleCommentsCount);
    const remainingComments = Math.max(comments.length - visibleCommentsCount, 0);

    if (loading) {
        return <p className='text-gray-500'>Loading comments...</p>;
    }

    return (
        <section className='relative mb-16'>
            {popup.show && (
                <div
                    className={`fixed right-5 top-5 z-[9999] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg
                    ${popup.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
                >
                    {popup.message}
                </div>
            )}

            <h2 className='mb-8 border-b pb-4 text-2xl font-bold'>Questions &amp; Answers</h2>

            <div className='mb-12 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
                <label
                    htmlFor='question-input'
                    className='mb-2 block text-sm font-semibold text-gray-700'
                >
                    Have a question? We&apos;re here to help.
                </label>

                <textarea
                    id='question-input'
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder='Ask a question about this product...'
                    className='mb-4 min-h-[100px] w-full rounded-lg border border-gray-300 p-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600'
                />

                <div className='flex justify-end'>
                    <button
                        onClick={handlePostQuestion}
                        className='rounded-lg bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700'
                    >
                        Post Question
                    </button>
                </div>
            </div>

            <div className='space-y-6'>
                {comments.length === 0 ? (
                    <div className='rounded-xl border border-gray-200 bg-white p-6 text-gray-500'>
                        No questions yet.
                    </div>
                ) : (
                    <>
                        {visibleComments.map((comment) => {
                            const isMyComment =
                                currentUsername && comment.user?.username === currentUsername;

                            const isFocusedComment = String(comment.id) === String(focusCommentId);

                            const rootReplies = Array.isArray(comment?.replies)
                                ? comment.replies
                                : [];
                            const rootExpanded = !!expandedRootComments[comment.id];
                            const rootHasManyReplies = rootReplies.length > DEFAULT_VISIBLE_REPLIES;

                            const visibleRootReplies = rootExpanded
                                ? rootReplies
                                : rootReplies.slice(0, DEFAULT_VISIBLE_REPLIES);

                            return (
                                <div
                                    id={`comment-${comment.id}`}
                                    key={comment.id}
                                    className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                                        isFocusedComment
                                            ? 'border-blue-400 ring-2 ring-blue-100'
                                            : 'border-gray-100'
                                    }`}
                                >
                                    <div className='mb-3 flex items-start justify-between'>
                                        <div className='w-full'>
                                            <span className='mb-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600'>
                                                Question
                                            </span>

                                            <h4 className='text-lg font-bold text-gray-900'>
                                                {comment.content}
                                            </h4>

                                            <div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400'>
                                                <span>Asked by {comment.user?.username}</span>
                                                <span className='h-1 w-1 rounded-full bg-gray-300'></span>
                                                <span>
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            {isMyComment && (
                                                <div className='mt-3'>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenReplyBox(comment.id)
                                                        }
                                                        className='text-sm font-medium text-blue-600 hover:text-blue-700'
                                                    >
                                                        {replyingCommentId === comment.id
                                                            ? 'Cancel'
                                                            : 'Reply'}
                                                    </button>
                                                </div>
                                            )}

                                            {isMyComment && replyingCommentId === comment.id && (
                                                <div className='mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) =>
                                                            setReplyContent(e.target.value)
                                                        }
                                                        placeholder='Write your reply...'
                                                        className='min-h-[90px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600'
                                                    />

                                                    <div className='mt-3 flex justify-end gap-2'>
                                                        <button
                                                            onClick={() => {
                                                                setReplyingCommentId(null);
                                                                setReplyContent('');
                                                            }}
                                                            className='rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handlePostReply(comment.id)
                                                            }
                                                            className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                                                        >
                                                            Send Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className='mt-6 ml-4 space-y-4 border-l-2 border-gray-100 pl-4 sm:ml-8'>
                                        {visibleRootReplies.map((reply) => (
                                            <ReplyItem
                                                key={reply.id}
                                                reply={reply}
                                                level={1}
                                                focusCommentId={focusCommentId}
                                            />
                                        ))}

                                        {rootHasManyReplies && (
                                            <button
                                                type='button'
                                                onClick={() => toggleRootReplies(comment.id)}
                                                className='text-xs font-bold text-blue-600 hover:underline'
                                            >
                                                {rootExpanded
                                                    ? 'Thu gọn'
                                                    : `Xem thêm ${rootReplies.length - DEFAULT_VISIBLE_REPLIES} phản hồi`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {remainingComments > 0 && (
                            <div className='flex justify-center pt-2'>
                                <button
                                    type='button'
                                    onClick={handleLoadMoreComments}
                                    className='rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100'
                                >
                                    Xem thêm {remainingComments} bình luận
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
