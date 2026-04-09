import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import { Routes, Route } from 'react-router-dom';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route path='dashboard' element={<AdminDashboardPage />} />
        </Routes>
    );
}
