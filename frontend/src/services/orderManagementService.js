import axios from 'axios';

// Cấu hình base URL hoặc dùng instance axios đã có của Ngọc
const API_BASE_URL = '/api/admin';

export const orderManagementService = {
    // --- Nhóm 1: Quản lý trạng thái đơn hàng (OrderManagement) ---
    
    // Lấy danh sách tất cả đơn hàng cho trang tổng quát
    getAllOrders: () => {
        return axios.get(`${API_BASE_URL}/orders/all`);
    },

    // Lấy chi tiết 1 đơn hàng
    getOrderById: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}`);
    },

    // Thay đổi trạng thái (Duyệt, Hủy...)
    changeStatus: (orderId, newStatus, reason) => {
        return axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, null, {
            params: { newStatus, reason }
        });
    },

    // Xem lịch sử "ai đã làm gì"
    getOrderHistory: (orderId) => {
        return axios.get(`${API_BASE_URL}/orders/${orderId}/history`);
    },

    // --- Nhóm 2: Xác minh cuộc gọi (OrderVerify) ---

    // Ghi nhật ký cuộc gọi mới
    logVerifyAttempt: (orderId, status, note) => {
        return axios.post(`${API_BASE_URL}/order-verify/${orderId}/log`, null, {
            params: { status, note }
        });
    },

    // Xem lịch sử các lần gọi của đơn này
    getVerifyHistory: (orderId) => {
        return axios.get(`${API_BASE_URL}/order-verify/${orderId}/history`);
    },

    // --- Nhóm 3: Nhật ký thanh toán (PaymentLog) ---

    // Tra cứu giao dịch PayPal/VNPAY
    getPaymentLogs: (orderId) => {
        return axios.get(`${API_BASE_URL}/payment-logs/order/${orderId}`);
    }
};