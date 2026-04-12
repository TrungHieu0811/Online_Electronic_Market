import api from '@/services/api';

export const getAdminReviewStats = async () => {
    const response = await api.get('/admin/reviews/stats');
    return response.data;
};

export const getAdminReviews = async ({ page = 0, size = 10, status = 'ALL' } = {}) => {
    const response = await api.get('/admin/reviews', {
        params: { page, size, status }
    });
    return response.data;
};

export const approveReview = async (reviewId) => {
    const response = await api.put(`/admin/reviews/${reviewId}/approve`);
    return response.data;
};

export const rejectReview = async (reviewId) => {
    const response = await api.put(`/admin/reviews/${reviewId}/reject`);
    return response.data;
};
