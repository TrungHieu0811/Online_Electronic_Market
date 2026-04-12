import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        return null;
    }
}

export default function AdminRoute({ children }) {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to='/login' replace state={{ from: location }} />;
    }

    const decoded = parseJwt(token);
    const role = decoded?.authorities?.[0]?.authority || decoded?.role || decoded?.userRole;

    const isAdmin = role === 'ROLE_SUPERADMIN' || role === 'ROLE_STAFF';

    if (!isAdmin) {
        return <Navigate to='/' replace />;
    }

    return children;
}
