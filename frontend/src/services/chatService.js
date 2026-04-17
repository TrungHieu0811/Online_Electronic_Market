import axios from 'axios';

const API_URL = 'http://localhost:8080/api/public/chat'; // URL công khai mới

export const sendChatMessage = async (message) => {
    const token = localStorage.getItem('token'); // Lấy token nếu có
    
    const config = {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {} // Gửi token linh hoạt
    };

    try {
        const response = await axios.post(API_URL, { message }, config);
        return response.data;
    } catch (error) {
        console.error("Lỗi Chat API:", error);
        throw error;
    }
};