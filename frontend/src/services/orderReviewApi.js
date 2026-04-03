import api from '@/services/api';

export const getOrderForReview = async (orderId) => {
    const res = await api.get(`/orders/${orderId}/review`);
    return res.data;
};

export const submitOrderReviews = async (orderId, payload) => {
    const res = await api.post(`/orders/${orderId}/reviews`, payload);
    return res.data;
};
