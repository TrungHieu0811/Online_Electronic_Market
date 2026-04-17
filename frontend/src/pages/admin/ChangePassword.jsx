import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api'; // Kiểm tra lại đường dẫn import api nhé

export default function ChangePassword() {
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!passwords.newPassword || !passwords.confirmPassword) {
            toast.warning("Please fill in all fields!");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("The confirmed password does not match!");
            return;
        }

        if (passwords.newPassword === '123') {
            toast.error("The password is too weak, please choose a different password!");
            return;
        }

        // 👉 THÊM ĐOẠN CHECK 6 KÝ TỰ Ở ĐÂY:
        if (passwords.newPassword.length < 6) {
            toast.error("The password must be at least 6 characters long!");
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API xuống Backend
            await api.put('/auth/change-password', { newPassword: passwords.newPassword });
            
            toast.success("Change password successful! Welcome back.");
            navigate('/admin'); // Đổi xong thì cho về thẳng Dashboard
            
        } catch (error) {
            toast.error(error.response?.data?.error || "An error occurred while changing the password!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-[80vh]">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Change Password</h2>
                <p className="text-center text-red-500 text-sm mb-6 bg-red-50 py-2 rounded">
                    Mandatory: You must change your default password to continue.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" name="newPassword" 
                            value={passwords.newPassword} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] outline-none"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                        <input 
                            type="password" name="confirmPassword" 
                            value={passwords.confirmPassword} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#045fae] outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button 
                        type="submit" disabled={isLoading}
                        className="w-full mt-4 px-4 py-2.5 bg-[#045fae] text-white font-bold rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}