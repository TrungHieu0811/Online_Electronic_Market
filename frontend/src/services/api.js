import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔥 BẮT BUỘC PHẢI CÓ
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    console.log('TOKEN:', token); // 👉 debug

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}
    ,
    (error) => {
        return Promise.reject(error);
    });

export default api;
