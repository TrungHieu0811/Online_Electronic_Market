import api from '@/services/api';

export const getInventoryDashboard = async (productId) => {
    const response = await api.get(`/admin/inventory-ai/dashboard/${productId}`);
    return response.data;
};

export const getReorderSuggestions = async () => {
    const response = await api.get('/admin/inventory-ai/reorder-suggestions');
    return response.data;
};

export const getStockAlerts = async () => {
    const response = await api.get('/admin/inventory-ai/stock-alerts');
    return response.data;
};

export const getSlowMovingProducts = async () => {
    const response = await api.get('/admin/inventory-ai/slow-moving');
    return response.data;
};

export const getForecast = async (productId) => {
    const response = await api.get(`/admin/inventory-ai/forecast/${productId}`);
    return response.data;
};

export const getReviewSentiment = async (productId) => {
    const response = await api.get(`/admin/inventory-ai/review-sentiment/${productId}`);
    return response.data;
};
