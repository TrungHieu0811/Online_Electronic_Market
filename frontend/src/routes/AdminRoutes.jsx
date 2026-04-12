import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import CouponManagementPage from '@/pages/admin/CouponManagementPage';
import { Routes, Route } from 'react-router-dom';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route path='dashboard' element={<AdminDashboardPage />} />
            <Route path='coupons' element={<CouponManagementPage />} />
           
        </Routes>
    );
}
