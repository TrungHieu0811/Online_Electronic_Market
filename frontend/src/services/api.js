import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8080/api',
});

// 🔥 BẮT BUỘC PHẢI CÓ
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');

	console.log('TOKEN:', token); // 👉 debug

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export default api;
