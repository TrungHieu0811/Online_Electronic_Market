// import StarRatingInput from './StarRatingInput';

// const QUICK_COMMENTS_BY_RATING = {
//     1: [
//         'Very disappointed',
//         'Poor quality',
//         'Not worth the price',
//         'Does not work well',
//         'Would not recommend'
//     ],
//     2: [
//         'Below expectations',
//         'Needs improvement',
//         'Not very satisfied',
//         'Could be better',
//         'Delivery was slow'
//     ],
//     3: [
//         'It is okay',
//         'Average quality',
//         'Works as expected',
//         'Decent product',
//         'Acceptable for the price'
//     ],
//     4: ['Good product', 'Good quality', 'Works very well', 'Worth the price', 'Fast delivery'],
//     5: [
//         'Excellent product',
//         'Amazing quality',
//         'Highly recommended',
//         'Beautiful design',
//         'Exceeded expectations'
//     ]
// };

// const DEFAULT_QUICK_COMMENTS = [
//     'Good product',
//     'Good quality',
//     'Works well',
//     'Worth the price',
//     'Fast delivery'
// ];

// export default function ReviewProductCard({ item, review, onRatingChange, onCommentChange }) {
//     console.log('item: ', item);

//     const BASE_IMAGE_URL = 'http://localhost:8080/uploads';
//     const selectedRating = review?.rating || 0;

//     const quickComments = QUICK_COMMENTS_BY_RATING[selectedRating] || DEFAULT_QUICK_COMMENTS;

//     const handleQuickCommentClick = (text) => {
//         const currentComment = review?.comment || '';

//         if (currentComment.includes(text)) return;

//         const newComment = currentComment ? `${currentComment}. ${text}` : text;

//         onCommentChange(item.id, newComment);
//     };

//     return (
//         <section className='mb-8 rounded-2xl bg-white p-8 shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
//             <div className='flex flex-col gap-8 md:flex-row'>
//                 <div className='h-48 w-full flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 md:w-48'>
//                     {item.image ? (
//                         <img
//                             src={
//                                 item.image.startsWith('http')
//                                     ? item.image
//                                     : `${BASE_IMAGE_URL + item.image}`
//                             }
//                             alt={item.name}
//                             className='h-full w-full object-cover'
//                         />
//                     ) : (
//                         <div className='flex h-full w-full items-center justify-center text-slate-400'>
//                             No Image
//                         </div>
//                     )}
//                 </div>

//                 <div className='flex-grow'>
//                     <div className='mb-6'>
//                         <h2 className='text-2xl font-bold text-slate-900'>{item.name}</h2>
//                         <p className='font-medium text-slate-600'>{item.variant}</p>
//                     </div>

//                     <div className='mb-8'>
//                         <p className='mb-4 text-sm font-bold uppercase tracking-tight text-slate-600'>
//                             Overall Rating
//                         </p>
//                         <StarRatingInput
//                             value={selectedRating}
//                             onChange={(value) => onRatingChange(item.id, value)}
//                         />

//                         {selectedRating > 0 && (
//                             <p className='mt-3 text-sm text-slate-500'>
//                                 Suggested comments for {selectedRating}-star review
//                             </p>
//                         )}
//                     </div>

//                     <div className='mb-2'>
//                         <label className='mb-3 block text-sm font-bold uppercase tracking-tight text-slate-600'>
//                             Review Details
//                         </label>

//                         <div className='mb-4 flex flex-wrap gap-2'>
//                             {quickComments.map((text) => (
//                                 <button
//                                     key={text}
//                                     type='button'
//                                     onClick={() => handleQuickCommentClick(text)}
//                                     className='rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 active:scale-95'
//                                 >
//                                     {text}
//                                 </button>
//                             ))}
//                         </div>

//                         <textarea
//                             value={review?.comment || ''}
//                             onChange={(e) => onCommentChange(item.id, e.target.value)}
//                             placeholder='Share your experience with this product...'
//                             className='min-h-[120px] w-full rounded-xl bg-slate-100 p-4 outline-none ring-0 transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#003f87]/30'
//                         />
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }

import { useState } from 'react';
import StarRatingInput from './StarRatingInput';
import { analyzeReviewSentiment, suggestReviewComments } from '@/services/reviewAiApi';

const QUICK_COMMENTS_BY_RATING = {
    1: [
        'Very disappointed',
        'Poor quality',
        'Not worth the price',
        'Does not work well',
        'Would not recommend'
    ],
    2: [
        'Below expectations',
        'Needs improvement',
        'Not very satisfied',
        'Could be better',
        'Delivery was slow'
    ],
    3: [
        'It is okay',
        'Average quality',
        'Works as expected',
        'Decent product',
        'Acceptable for the price'
    ],
    4: ['Good product', 'Good quality', 'Works very well', 'Worth the price', 'Fast delivery'],
    5: [
        'Excellent product',
        'Amazing quality',
        'Highly recommended',
        'Beautiful design',
        'Exceeded expectations'
    ]
};

const DEFAULT_QUICK_COMMENTS = [
    'Good product',
    'Good quality',
    'Works well',
    'Worth the price',
    'Fast delivery'
];

export default function ReviewProductCard({ item, review, onRatingChange, onCommentChange }) {
    const BASE_IMAGE_URL = 'http://localhost:8080/uploads';
    const selectedRating = review?.rating || 0;

    const [sentimentResult, setSentimentResult] = useState(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    const [sentimentError, setSentimentError] = useState('');

    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [suggestLoading, setSuggestLoading] = useState(false);

    const quickComments =
        aiSuggestions.length > 0
            ? aiSuggestions
            : QUICK_COMMENTS_BY_RATING[selectedRating] || DEFAULT_QUICK_COMMENTS;

    const handleQuickCommentClick = (text) => {
        const currentComment = review?.comment || '';

        if (currentComment.includes(text)) return;

        const newComment = currentComment ? `${currentComment}. ${text}` : text;
        onCommentChange(item.id, newComment);
    };

    const handleAnalyzeSentiment = async () => {
        const content = review?.comment?.trim();

        if (!content) {
            setSentimentError('Please enter review content first.');
            setSentimentResult(null);
            return;
        }

        try {
            setSentimentLoading(true);
            setSentimentError('');

            const data = await analyzeReviewSentiment({
                content,
                productId: item.productId || item.id,
                userId: null
            });

            setSentimentResult(data);
        } catch (error) {
            console.error(error);
            setSentimentError(
                error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    'Failed to analyze sentiment.'
            );
            setSentimentResult(null);
        } finally {
            setSentimentLoading(false);
        }
    };

    const handleSuggestByAi = async () => {
        if (!selectedRating) return;

        try {
            setSuggestLoading(true);

            const data = await suggestReviewComments({
                rating: selectedRating,
                productName: item.name,
                categoryName: item.categoryName || '',
                productId: item.productId || item.id,
                userId: null
            });

            setAiSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        } catch (error) {
            console.error(error);
            setAiSuggestions([]);
        } finally {
            setSuggestLoading(false);
        }
    };

    const getSentimentBadgeClass = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'NEGATIVE':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <section className='mb-8 rounded-2xl bg-white p-8 shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
            <div className='flex flex-col gap-8 md:flex-row'>
                <div className='h-48 w-full flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 md:w-48'>
                    {item.image ? (
                        <img
                            src={
                                item.image.startsWith('http')
                                    ? item.image
                                    : `${BASE_IMAGE_URL + item.image}`
                            }
                            alt={item.name}
                            className='h-full w-full object-cover'
                        />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center text-slate-400'>
                            No Image
                        </div>
                    )}
                </div>

                <div className='flex-grow'>
                    <div className='mb-6'>
                        <h2 className='text-2xl font-bold text-slate-900'>{item.name}</h2>
                        <p className='font-medium text-slate-600'>{item.variant}</p>
                    </div>

                    <div className='mb-8'>
                        <p className='mb-4 text-sm font-bold uppercase tracking-tight text-slate-600'>
                            Overall Rating
                        </p>
                        <StarRatingInput
                            value={selectedRating}
                            onChange={(value) => {
                                onRatingChange(item.id, value);
                                setAiSuggestions([]);
                            }}
                        />

                        {selectedRating > 0 && (
                            <div className='mt-4 flex flex-wrap gap-3'>
                                <button
                                    type='button'
                                    onClick={handleSuggestByAi}
                                    disabled={suggestLoading}
                                    className='rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60'
                                >
                                    {suggestLoading ? 'Generating...' : 'Suggest with AI'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className='mb-2'>
                        <label className='mb-3 block text-sm font-bold uppercase tracking-tight text-slate-600'>
                            Review Details
                        </label>

                        <div className='mb-4 flex flex-wrap gap-2'>
                            {quickComments.map((text) => (
                                <button
                                    key={text}
                                    type='button'
                                    onClick={() => handleQuickCommentClick(text)}
                                    className='rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 active:scale-95'
                                >
                                    {text}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={review?.comment || ''}
                            onChange={(e) => onCommentChange(item.id, e.target.value)}
                            placeholder='Share your experience with this product...'
                            className='min-h-[120px] w-full rounded-xl bg-slate-100 p-4 outline-none ring-0 transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#003f87]/30'
                        />

                        {/* <div className='mt-4 flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={handleAnalyzeSentiment}
                                disabled={sentimentLoading}
                                className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'
                            >
                                {sentimentLoading ? 'Analyzing...' : 'Analyze with AI'}
                            </button>

                            {sentimentResult?.sentiment && (
                                <span
                                    className={`rounded-full border px-3 py-1 text-sm font-bold ${getSentimentBadgeClass(
                                        sentimentResult.sentiment
                                    )}`}
                                >
                                    {sentimentResult.sentiment}
                                </span>
                            )}
                        </div>

                        {sentimentResult?.explanation && (
                            <p className='mt-3 text-sm text-slate-500'>
                                AI explanation: {sentimentResult.explanation}
                            </p>
                        )} */}

                        {sentimentError && (
                            <p className='mt-3 text-sm font-medium text-red-500'>
                                {sentimentError}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
