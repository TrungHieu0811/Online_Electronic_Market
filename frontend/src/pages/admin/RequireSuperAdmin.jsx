import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

export default function RequireSuperAdmin({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // "Mổ" token ra để đọc quyền
        const decodedToken = jwtDecode(token);
        let userRoles = decodedToken.roles || decodedToken.role || decodedToken.authorities || [];
        
        if (typeof userRoles === 'string') {
            userRoles = [userRoles];
        }

        const roleStrings = userRoles.map(r => 
            typeof r === 'string' ? r.toUpperCase() : (r.authority || '').toUpperCase()
        );

        // Kiểm tra xem có quyền SUPERADMIN không
        const isSuperAdmin = roleStrings.includes('SUPERADMIN') || roleStrings.includes('ROLE_SUPERADMIN');

        if (!isSuperAdmin) {
            // Nếu không phải SuperAdmin -> Báo lỗi và đá về trang Dashboard của Admin
            toast.error("Access Denied! Chỉ SuperAdmin mới được phép truy cập.");
            return <Navigate to="/admin" replace />;
        }

        // Nếu đúng là SuperAdmin -> Cho phép hiển thị giao diện bên trong
        return children;
        
    } catch (error) {
        console.error("Token error:", error);
        return <Navigate to="/login" replace />;
    }
}