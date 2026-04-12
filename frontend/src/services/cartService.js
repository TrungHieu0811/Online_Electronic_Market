import axios from 'axios';

const API_URL = 'http://localhost:8080/api/public/cart-items';

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
    removeItem: (id) => axios.delete(`${API_URL}/${id}`, getAuthHeader()),

    // Add to cart
    addToCart: (productId, quantity) =>
        axios.post(`${API_URL}/add?productId=${productId}&quantity=${quantity}`, {}, getAuthHeader()),

    getCartCount: () => axios.get(`${API_URL}/count`, getAuthHeader()),

    toggleAll: (selected) => 
    axios.patch(`${API_URL}/toggle-all?selected=${selected}`, {}, getAuthHeader()),

    // Xóa nhiêù item
    removeMultipleItems: (ids) => axios.delete(`${API_URL}/remove-multiple`, { data: ids, ...getAuthHeader() }),

    mergeCart: (guestItems) => 
        axios.post(`${API_URL}/merge`, guestItems, getAuthHeader()),

    getFullCartDetails: () => axios.get(API_URL, getAuthHeader()),
};