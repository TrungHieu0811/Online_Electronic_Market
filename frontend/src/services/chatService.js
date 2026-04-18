import axios from 'axios';

// Đảm bảo không có dấu / ở cuối URL
const API_URL = 'http://localhost:8080/api/public/chat'; 

export const sendChatMessage = async (message) => {
    const token = localStorage.getItem('token'); 
    
    // Sử dụng dấu huyền ` ` để truyền biến token chính xác
    const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
    };

    try {
        const response = await axios.post(API_URL, { message }, config);
        return response.data;
    } catch (error) {
        console.error("Lỗi AI Chat:", error);
        throw error;
    }
};