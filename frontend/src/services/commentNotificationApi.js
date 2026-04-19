import api from '@/services/api';

export const getMyCommentNotifications = async () => {
    const res = await api.get('/notifications/comments');
    return res.data;
};

export const markCommentNotificationAsRead = async (notificationId) => {
    const res = await api.put(`/notifications/comments/${notificationId}/read`);
    return res.data;
};

export const markAllCommentNotificationsAsRead = async () => {
    const res = await api.put('/notifications/comments/read-all');
    return res.data;
};
