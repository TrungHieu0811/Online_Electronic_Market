import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';
const PUBLIC_WEBHOOK_URL = 'http://localhost:8080/api/public/webhook'; // Endpoint cho Webhook

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const orderManagementService = {
    // --- Nhóm 1: Quản lý trạng thái & Tìm kiếm ---
    
    // Cập nhật: Thêm params status để lọc theo Tab (PENDING, SHIPPING, DELIVERED...)
    getAllOrders: (page = 0, size = 10, status = '') => {
        return axios.get(`${API_BASE_URL}/orders/all`, {
            params: { page, size, status },
            ...getAuthHeader()
        });
    },

    // Mới: Tìm kiếm đơn hàng theo ID hoặc Tên người nhận (Khớp với hàm mới ở Backend)
    searchOrders: (searchText, page = 0, size = 10) => {
        return axios.get(`${API_BASE_URL}/orders/filter`, {
            params: { searchText, page, size },
            ...getAuthHeader()
        });
    },

    // --- Nhóm 2: AI & Bằng chứng giao hàng (Cực kỳ quan trọng để Demo) ---

    // Mới: Lấy danh sách ảnh bằng chứng và kết quả phân tích AI của đơn hàng
    getOrderEvidences: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}/evidences`, getAuthHeader());
    },

    // Mới: HÀM GIẢ LẬP WEBHOOK GHN (Nút bấm thần thánh để Demo AI)
    simulateGHNWebhook: (orderId, imageUrl) => {
        return axios.post(`${PUBLIC_WEBHOOK_URL}/ghn`, {
            order_id: orderId,
            image_proof_url: imageUrl},
            getAuthHeader()
        );
    },

    // --- Nhóm 3: Lịch sử & Nhật ký (Giữ nguyên cấu trúc của Ngọc) ---
    
    getOrderById: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}`, getAuthHeader());
    },

    changeStatus: (orderId, newStatus, reason) => {
        return axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, null, {
            params: { newStatus, reason },
            ...getAuthHeader(),
        });
    },

    getOrderHistory: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}/history`,
            getAuthHeader()
        );
    },

    // --- Nhóm 4: Xác minh & Thanh toán (Giữ nguyên) ---
    logVerifyAttempt: (orderId, status, note) => {
        return axios.post(`${API_BASE_URL}/order-verify/${orderId}/log`, null, {
            params: { status, note },
            ...getAuthHeader(),
        });
    },

    getPaymentLogs: (orderId) => {
        return axios.get(`${API_BASE_URL}/payment-logs/order/${orderId}`,
            getAuthHeader(),
        );
    },

    getVerifyHistory: (orderId) => {
        return axios.get(`${API_BASE_URL}/order-verify/${orderId}/history`, getAuthHeader());
    },

    getOrderItems: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}/items`, getAuthHeader());
    },

    refundPayPalOrder: (orderId) => {
        return axios.post(`${API_BASE_URL}/orders/${orderId}/refund-paypal`, {}, getAuthHeader());
    },

    getOrderStats: () => {
        return axios.get(`${API_BASE_URL}/orders/stats`, getAuthHeader());
    },
};