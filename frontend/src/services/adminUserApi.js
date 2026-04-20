import api from './api';

// ==============================
// GET USERS: search + filter + pagination
// ==============================
export const getAdminUsers = async ({ keyword = '', status, role, roleType = 'USER', page = 0, size = 10 } = {}) => {
    try {
        const params = {
            keyword,
            page,
            size,
            roleType // 👉 Bổ sung thêm dòng này để gửi chữ "ADMIN" hoặc "USER" xuống Spring Boot
        };

        if (status !== undefined && status !== null && status !== '') {
            params.status = status;
        }

        if (role) {
            params.role = role;
        }

        const response = await api.get('/admin/users', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching admin users:', error);
        throw error;
    }
};

// ==============================
// GET USER STATS
// ==============================
export const getAdminUserStats = async () => {
    try {
        const response = await api.get('/admin/users/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin user stats:', error);
        throw error;
    }
};

// ==============================
// BLOCK USER
// ==============================
export const blockAdminUser = async (userId, reason = 'Vi phạm chính sách') => {
    try {
        const response = await api.post(`/admin/users/${userId}/disable`, {
            reason
        });
        return response.data;
    } catch (error) {
        console.error(`Error blocking user ${userId}:`, error);
        throw error;
    }
};

// ==============================
// UNBLOCK USER
// ==============================
export const unblockAdminUser = async (userId) => {
    try {
        const response = await api.post(`/admin/users/${userId}/enable`);
        return response.data;
    } catch (error) {
        console.error(`Error unblocking user ${userId}:`, error);
        throw error;
    }
};
