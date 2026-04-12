import api from './api';

// lấy toàn bộ dashboard
export const getDashboard = async (range = '30days') => {
    try {
        const response = await api.get(`/admin/dashboard`, {
            params: { range }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        throw error;
    }
};
