import axios from 'axios';

const api = axios.create({
    // Nên dùng URL đầy đủ để tránh bị redirect về trang chủ (gây ra lỗi nhận mã HTML)
    baseURL: 'http://localhost:8080/api/users/orders' 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const checkoutService = {
    previewShippingFee: async (districtId, wardCode, totalAmount) => {
        const response = await api.get('/preview-fee', {
            params: { 
                districtId: districtId, 
                wardCode: wardCode, 
                totalAmount: totalAmount 
            }
        });
        
        return response.data;
    },

    placeOrder: async (orderRequest) => {
        const response = await api.post('/checkout', orderRequest);
        return response.data;
    }
};