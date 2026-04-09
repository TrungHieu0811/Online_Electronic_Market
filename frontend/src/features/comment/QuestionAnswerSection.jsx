import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function QuestionAnswerSection({ productId }) {
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

    const getToken = () => localStorage.getItem('token');

    const currentUsername = useMemo(() => {
        const token = getToken();
        if (!token) return null;

        try {
            const payloadBase64 = token.split('.')[1];
            const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);

            // thường username nằm ở sub
            return payload?.sub || payload?.username || null;
        } catch (error) {
            console.error('Cannot decode token:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        fetchComments();
    }, [productId]);

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
            setComments(res.data || []);
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

    if (loading) {
        return <p className='text-gray-500'>Loading comments...</p>;
    }

    return (
        <section className='mb-16 relative'>
            {popup.show && (
                <div
                    className={`fixed top-5 right-5 z-[9999] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium
                    ${popup.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
                >
                    {popup.message}
                </div>
            )}

            <h2 className='text-2xl font-bold mb-8 border-b pb-4'>Questions &amp; Answers</h2>

            <div className='mb-12 bg-white p-6 rounded-xl border border-gray-200 shadow-sm'>
                <label
                    htmlFor='question-input'
                    className='block text-sm font-semibold text-gray-700 mb-2'
                >
                    Have a question? We&apos;re here to help.
                </label>

                <textarea
                    id='question-input'
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder='Ask a question about this product...'
                    className='w-full p-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[100px] mb-4'
                />

                <div className='flex justify-end'>
                    <button
                        onClick={handlePostQuestion}
                        className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md shadow-blue-100 text-sm'
                    >
                        Post Question
                    </button>
                </div>
            </div>

            <div className='space-y-6'>
                {comments.length === 0 ? (
                    <div className='bg-white p-6 rounded-xl border border-gray-200 text-gray-500'>
                        No questions yet.
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isMyComment =
                            currentUsername && comment.user?.username === currentUsername;

                        return (
                            <div
                                key={comment.id}
                                className='bg-white p-6 rounded-xl border border-gray-100 shadow-sm'
                            >
                                <div className='flex justify-between items-start mb-3'>
                                    <div className='w-full'>
                                        <span className='inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2'>
                                            Question
                                        </span>

                                        <h4 className='font-bold text-gray-900 text-lg'>
                                            {comment.content}
                                        </h4>

                                        <div className='text-xs text-gray-400 flex items-center gap-2 mt-1 flex-wrap'>
                                            <span>Asked by {comment.user?.username}</span>
                                            <span className='w-1 h-1 bg-gray-300 rounded-full'></span>
                                            <span>
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Chỉ hiện Reply cho comment của chính mình */}
                                        {isMyComment && (
                                            <div className='mt-3'>
                                                <button
                                                    onClick={() => handleOpenReplyBox(comment.id)}
                                                    className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                                                >
                                                    {replyingCommentId === comment.id
                                                        ? 'Cancel'
                                                        : 'Reply'}
                                                </button>
                                            </div>
                                        )}

                                        {isMyComment && replyingCommentId === comment.id && (
                                            <div className='mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                                <textarea
                                                    value={replyContent}
                                                    onChange={(e) =>
                                                        setReplyContent(e.target.value)
                                                    }
                                                    placeholder='Write your reply...'
                                                    className='w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[90px]'
                                                />

                                                <div className='flex justify-end gap-2 mt-3'>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingCommentId(null);
                                                            setReplyContent('');
                                                        }}
                                                        className='px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm'
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        onClick={() => handlePostReply(comment.id)}
                                                        className='px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium'
                                                    >
                                                        Send Reply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='mt-6 ml-4 sm:ml-8 pl-4 border-l-2 border-gray-100 space-y-4'>
                                    {(comment.replies || []).map((reply) => (
                                        <div key={reply.id} className='relative'>
                                            <div className='absolute -left-[21px] top-3 w-4 h-[2px] bg-gray-100'></div>

                                            <div className='flex items-start gap-3'>
                                                <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                                                    <svg
                                                        className='w-4 h-4 text-blue-600'
                                                        fill='currentColor'
                                                        viewBox='0 0 20 20'
                                                    >
                                                        <path d='M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z'></path>
                                                    </svg>
                                                </div>

                                                <div>
                                                    <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                                        <span className='font-bold text-sm text-gray-900'>
                                                            {reply.user?.username}
                                                        </span>

                                                        {reply.isAdminReply && (
                                                            <span className='bg-yellow-400/10 text-yellow-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase'>
                                                                Admin
                                                            </span>
                                                        )}

                                                        <span className='text-[10px] text-gray-400'>
                                                            {new Date(
                                                                reply.createdAt
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <p className='text-sm text-gray-600 leading-relaxed'>
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
