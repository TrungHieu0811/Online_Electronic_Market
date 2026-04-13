import api from '@/services/api';

export const getMyProfile = async () => {
    const response = await api.get('/users/me');
    console.log(response.data);
    return response.data;
};

export const updateMyProfile = async (payload) => {
    const response = await api.put('/users/me', payload);
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/users/upload-avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return response.data;
};

export const getMyOrders = async () => {
    const response = await api.get('/users/orders/me');
    return response.data;
};
