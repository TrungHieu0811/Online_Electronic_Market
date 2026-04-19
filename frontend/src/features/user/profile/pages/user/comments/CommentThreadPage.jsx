import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import QuestionAnswerSection from '@/features/comment/QuestionAnswerSection';

export default function CommentThreadPage() {
    const { productId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const focusCommentId = searchParams.get('focusCommentId');

    const [productInfo, setProductInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductInfo = async () => {
            try {
                const res = await api.get(`/public/products/${productId}/basic-info`);
                setProductInfo(res.data);
            } catch (error) {
                console.error('Failed to fetch product info:', error);
                setProductInfo(null);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductInfo();
        }
    }, [productId]);

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='mx-auto max-w-5xl px-4 py-8'>
                <div className='mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
                    {loading ? (
                        <p className='text-sm text-gray-500'>Loading thread...</p>
                    ) : (
                        <>
                            <p className='text-xs font-bold uppercase tracking-widest text-gray-400'>
                                Comment Thread
                            </p>

                            <h1 className='mt-2 text-2xl font-bold text-gray-900'>
                                {productInfo?.variantName || `Product #${productId}`}
                            </h1>

                            <p className='mt-2 text-sm text-gray-500'>
                                Bạn đang xem cuộc trò chuyện liên quan đến sản phẩm này.
                            </p>

                            <div className='mt-4 flex flex-wrap gap-3'>
                                <button
                                    type='button'
                                    onClick={() => navigate(-1)}
                                    className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
                                >
                                    Quay lại
                                </button>

                                {productInfo?.slug && (
                                    <button
                                        type='button'
                                        onClick={() => navigate(`/products/${productInfo.slug}`)}
                                        className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                                    >
                                        Xem sản phẩm
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
                    <QuestionAnswerSection
                        productId={Number(productId)}
                        focusCommentId={focusCommentId}
                    />
                </div>
            </div>
        </div>
    );
}
