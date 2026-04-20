import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

// 👉 1. NHỚ IMPORT BỘ KHUNG LAYOUT VÀO NHÉ (Sửa lại đường dẫn nếu project bạn để thư mục khác)
import AdminSidebar from '../../components/admin/AdminSidebar'; 
import AdminHeader from '../../components/admin/AdminHeader';

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

        if (!formData.username || !formData.email) {
            toast.warning("Please fill in all required fields!");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/admin/users/create-admin', formData);
            toast.success(response.data.message || "Admin account created successfully!");
            setFormData({ username: '', email: '', password: '', fullName: '', phone: '' });
        } catch (error) {
            if (error.response && error.response.status === 400) {
                const data = error.response.data;
                if (data.generalError || data.error || data.message) {
                    toast.error(data.generalError || data.error || data.message);
                } else {
                    setFieldErrors(data);
                    toast.error("Please check your input!");
                }
            } else {
                toast.error("An error occurred!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 👉 2. CẤU TRÚC GIAO DIỆN MỚI
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Cố Định Bên Trái */}
            <AdminSidebar />
            
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header Cố Định Phía Trên */}
                <AdminHeader />

                {/* Vùng Chứa Nội Dung Chính */}
                <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
                    
                    {/* Tiêu đề trang (Làm giống hệt trang Order) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 italic uppercase">Account Management</h1>
                            <p className="text-slate-500 text-sm">Create a new system administrator</p>
                        </div>
                    </div>

                    {/* Cái form cũ của bạn được bọc vào đây */}
                    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mt-4">
                        <div className="mb-8 border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-800">Admin Information</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" name="username" value={formData.username} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none transition-all"
                                        placeholder="Enter username"
                                    />
                                    {fieldErrors.username && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.username}</p>}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] focus:border-[#045fae] outline-none transition-all"
                                        placeholder="admin@electromart.com"
                                    />
                                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-[#045fae] text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:shadow-none"
                                >
                                    {isLoading ? 'Creating...' : 'Create Admin Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                    
                </div>
            </main>
        </div>
    );
}