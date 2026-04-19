import api from './api';

export const getReviewSummary = async (productId) => {
    try {
        const response = await api.get(`/reviews/product/${productId}/summary`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy review summary:', error);
        throw error;
    }
};

export const getProductReviews = async (productId) => {
    try {
        const response = await api.get(`/reviews/product/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách review:', error);
        throw error;
    }
};
