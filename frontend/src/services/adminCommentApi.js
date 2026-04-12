import api from '@/services/api';

export const getAdminCommentProducts = async ({ page = 0, size = 10 } = {}) => {
    const response = await api.get('/admin/comments/products', {
        params: { page, size }
    });
    return response.data;
};

export const getAdminCommentsByProduct = async (productId) => {
    const response = await api.get(`/admin/comments/product/${productId}`);
    return response.data;
};

export const markAdminCommentsAsRead = async (productId) => {
    const response = await api.put(`/admin/comments/product/${productId}/mark-read`);
    return response.data;
};

export const replyAdminComment = async (payload) => {
    const response = await api.post('/admin/comments/reply', payload);
    return response.data;
};
