import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 👉 Nhớ cài thư viện này nếu chưa có: npm install jwt-decode
import { FiLogOut } from 'react-icons/fi';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    UserPlus,
    Settings,
    Bolt,
    BrainCircuit
} from 'lucide-react';

const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard', active: true },
    { label: 'AI Inventory', icon: BrainCircuit, href: 'inventory-ai' },
    { label: 'Categories', icon: Package, href: 'categories' },
    { label: 'Brands', icon: Package, href: 'brands' },
    { label: 'ProductGroups', icon: Package, href: 'products/groups' },
    { label: 'Products', icon: Package, href: 'products' },
    { label: 'Orders', icon: ShoppingCart, href: 'orders' },
    { label: 'Users', icon: Users, href: 'users' },
    { label: 'Reviews & Comments', icon: Users, href: 'reviews-comments' },
    { label: 'Coupons', icon: Package, href: 'coupons' },

    // 👉 CẬP NHẬT PHẦN CREATE ADMIN TẠI ĐÂY
    {
        label: 'Create Admin',
        icon: UserPlus, // Dùng UserPlus nhìn sẽ chuẩn "Add Admin" hơn
        href: 'create-admin',
        requiresSuperAdmin: true // Đặt flag này để sau này bạn check quyền ẩn/hiện menu
    }
];

export default function AdminSidebar() {
    const currentPath = (window.location.href.split('/admin/')[1] || '/').split('?')[0];
    const navigate = useNavigate();

    // 👉 1. KHAI BÁO STATE LƯU THÔNG TIN ADMIN
    const [adminInfo, setAdminInfo] = useState({
        name: 'Đang tải...',
        role: 'Admin',
        avatar: 'https://ui-avatars.com/api/?name=A&background=045fae&color=fff'
    });

    // 👉 2. CHẠY LẤY DỮ LIỆU KHI VỪA MỞ SIDEBAR
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token) {
            try {
                const decoded = jwtDecode(token);

                // Xác định chức danh (Role)
                let currentRole = 'Staff Admin';
                let rolesStr = JSON.stringify(
                    decoded.roles || decoded.role || decoded.authorities || ''
                );
                if (rolesStr.toUpperCase().includes('SUPERADMIN')) {
                    currentRole = 'Super Admin';
                }

                // Xác định Tên
                let currentName = decoded.sub || 'Admin'; // Mặc định lấy username
                let currentAvatar = null;

                // Ưu tiên lấy fullName và avatar thực tế nếu có lưu lúc login
                if (userStr) {
                    try {
                        const userObj = JSON.parse(userStr);
                        currentName = userObj.fullName || userObj.username || currentName;
                        currentAvatar = userObj.avatarUrl || userObj.avatar;
                    } catch (e) {
                        console.error('Lỗi đọc dữ liệu user từ localStorage');
                    }
                }

                // Nếu không có ảnh, tự tạo ảnh xịn xò từ chữ cái đầu của tên
                if (!currentAvatar) {
                    currentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName)}&background=045fae&color=fff&rounded=true&bold=true`;
                }

                // Cập nhật lên màn hình
                setAdminInfo({
                    name: currentName,
                    role: currentRole,
                    avatar: currentAvatar
                });
            } catch (error) {
                console.error('Lỗi giải mã token:', error);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <aside className='w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col justify-between'>
            <div className='flex flex-col p-6 gap-8'>
                <Link to={`/admin`}>
                    <div className='flex items-center gap-3'>
                        <div className='bg-sky-500 rounded-xl p-2 text-white'>
                            <Bolt size={22} />
                        </div>

                        <div className='flex flex-col'>
                            <h1 className='text-slate-900 text-lg font-bold leading-none'>
                                ElectroMart
                            </h1>
                            <p className='text-slate-500 text-xs font-medium'>Admin Console</p>
                        </div>
                    </div>
                </Link>

                <nav className='flex flex-col gap-1'>
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                to={`/admin/${item.href}`}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                                    currentPath === item.href
                                        ? 'bg-sky-100 text-sky-600'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={20} />
                                <span
                                    className={`text-sm ${item.active ? 'font-semibold' : 'font-medium'}`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* 👉 3. PHẦN PROFILE DƯỚI CÙNG ĐÃ ĐƯỢC LÀM ĐỘNG */}
            <div className='p-6 border-t border-slate-100'>
                <div className='flex items-center gap-3'>
                    <img
                        src={adminInfo.avatar}
                        alt='Admin avatar'
                        className='w-10 h-10 rounded-full border-2 border-slate-200 object-cover'
                    />

                    <div className='flex flex-col overflow-hidden'>
                        <p
                            className='text-sm font-bold text-slate-900 truncate'
                            title={adminInfo.name} // Di chuột vào sẽ hiện tên đầy đủ nếu bị dài quá
                        >
                            {adminInfo.name}
                        </p>
                        <p className='text-xs text-slate-500 truncate' title={adminInfo.role}>
                            {adminInfo.role}
                        </p>

                        <button
                            onClick={handleLogout}
                            className='mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium text-left transition-colors'
                        >
                            <FiLogOut className='w-3.5 h-3.5' />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
