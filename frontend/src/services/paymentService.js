
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/users/payment';

const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const paymentService = {
    createPayment: async (orderId, method) => {
        const response = await axios.get(
            `${API_BASE}/create?orderId=${orderId}&method=${method}`, 
            getHeaders()
        );
        return response.data; // Trả về { paymentUrl: '...' } hoặc { message: '...' }
    }
};