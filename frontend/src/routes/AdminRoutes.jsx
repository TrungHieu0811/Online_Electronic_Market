import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import UserManagementPage from '@/components/admin/UserManagement';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<AdminDashboardPage />} />
            <Route path='users' element={<UserManagementPage />} />
        </Routes>
    );
}
