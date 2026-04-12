import api from './api'; // Import cái file Axios Instance bạn đã tạo

export const getProducts = async () => {
    try {
        // Giả sử Backend có endpoint: GET http://localhost:8080/api/products
        const response = await api.get('/public/products'); // Gọi API với tham số phân trang
        return response; // Trả về dữ liệu danh sách sản phẩm
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
        throw error;
    }
};

export const getProductDetail = async (slug) => {
    try {
        // Giả sử Backend có endpoint: GET http://localhost:8080/api/products
        const response = await api.get(`/public/products/${slug}`); // Gọi API với tham số phân trang
        return response; // Trả về dữ liệu danh sách sản phẩm
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
        throw error;
    }
};
