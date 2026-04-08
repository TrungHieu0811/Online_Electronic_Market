import axios from 'axios';

const API_URL = 'http://localhost:8080/api/users/cart-items';

// Lấy Token từ localStorage (giả sử bạn lưu token khi login)
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const cartService = {
    // Lấy giỏ hàng
    getMyCart: () => axios.get(API_URL, getAuthHeader()),

    // Cập nhật số lượng
    updateQuantity: (id, quantity) =>
        axios.put(`${API_URL}/${id}?quantity=${quantity}`, {}, getAuthHeader()),

    // Đảo trạng thái chọn (isSelected)
    toggleSelection: (id) =>
        axios.patch(`${API_URL}/${id}/toggle-selection`, {}, getAuthHeader()),

    // Xóa item
    removeItem: (id) => axios.delete(`${API_URL}/${id}`, getAuthHeader())
};