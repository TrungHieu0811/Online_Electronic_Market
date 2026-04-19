import api from '@/services/api';

export const analyzeReviewSentiment = async ({ content, productId, userId }) => {
    const res = await api.post('/ai/reviews/sentiment', {
        content,
        productId,
        userId
    });
    return res.data;
};

export const suggestReviewComments = async ({
    rating,
    productName,
    categoryName,
    productId,
    userId
}) => {
    const res = await api.post('/ai/reviews/suggest', {
        rating,
        productName,
        categoryName,
        productId,
        userId
    });
    return res.data;
};

export const summarizeReviewsByAi = async ({ productId, reviews }) => {
    const res = await api.post('/ai/reviews/summary', {
        productId,
        reviews
    });
    return res.data;
};

export const getAiUsageStats = async () => {
    const res = await api.get('/ai/reviews/stats');
    return res.data;
};
