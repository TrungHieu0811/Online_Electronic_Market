import React, { useState } from 'react';
import { toast } from 'react-toastify';
// Bạn nhớ import file api gọi xuống Backend nhé, ví dụ:
// import adminApi from '@/services/adminApi';

// 👉 THÊM DÒNG NÀY VÀO: Gọi bác bảo vệ api.js vào để làm việc
import api from '../../services/api';

export default function CreateAdmin() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({
                ...fieldErrors,
                [e.target.name]: null
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate cơ bản
        if (!formData.username || !formData.email) {
            toast.warning("Please fill in all required fields!");
            return;
        }

        setIsLoading(true);
        try {
            // Nhớ dùng file api.js có gắn sẵn interceptors để nó tự nhét Access Token của SuperAdmin vào header nhé
            const response = await api.post('/admin/users/create-admin', formData);

            toast.success(response.data.message || "Admin account created successfully!");
            setFormData({ username: '', email: '', password: '', fullName: '', phone: '' });
        } catch (error) {
            // 👉 KIỂM TRA VÀ HIỂN THỊ LỖI
            // console.log("CHI TIẾT LỖI:", error);
            // alert("LỖI GỐC LÀ: " + error.message);
            if (error.response && error.response.status === 400) {
                const data = error.response.data;
                // alert("CHI TIẾT LỖI TỪ BACKEND: " + JSON.stringify(data));

                // Nếu là lỗi chung (generalError) như Trùng email, Trùng username...
                if (data.generalError || data.error || data.message) {
                    toast.error(data.generalError || data.error || data.message);
                }
                // Nếu là lỗi của từng ô (Validation)
                else {
                    setFieldErrors(data); // Cập nhật state lỗi để in xuống dưới các input
                    toast.error("Please check your input!");
                }
            } else {
                toast.error("An error occurred!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Create New Admin</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username *</label>
                        <input
                            type="text" name="username" value={formData.username} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none"
                            placeholder="Enter username"
                        />
                        {/* 👉 In chữ đỏ báo lỗi ở đây */}
                        {fieldErrors.username && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.username}</p>}
                    </div>

                    

                    {/* Email */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none"
                            placeholder="admin@electromart.com"
                        />
                        {fieldErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none"
                            placeholder="Enter full name"
                        />
                    </div>

                
                </div>

                <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-[#045fae] text-white font-bold rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
                    >
                        {isLoading ? 'Creating...' : 'Create Admin Account'}
                    </button>
                </div>
            </form>
        </div>
    );
}