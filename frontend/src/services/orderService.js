import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/users/orders';

const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const orderService = {
    // Lấy thông tin chung của đơn hàng (trạng thái, tổng tiền...)
    getOrderDetail: (orderId) => 
        axios.get(`${API_BASE}/orders/${orderId}`, getHeaders()),

    // Lấy danh sách các món hàng trong đơn đó
    getOrderItems: (orderId) => 
        axios.get(`${API_BASE}/order-details/${orderId}`, getHeaders()),

    // Gửi yêu cầu hủy đơn hàng (Backend sẽ tự xử lý hoàn tiền PayPal nếu cần)
    cancelOrder: (orderId) => 
        axios.post(`${API_BASE}/orders/${orderId}/cancel`, {}, getHeaders())
};