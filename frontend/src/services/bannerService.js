import api from './api';

export const getActiveBanners = async () => {
    try {
        const response = await api.get('/public/banners');
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy banners:", error);
        return [];
    }
};