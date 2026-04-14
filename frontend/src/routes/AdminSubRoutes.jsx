import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import CreateBrandPage from '@/pages/admin/brand/CreateBrandPage';
import AdminBrandPage from '@/pages/admin/brand/AdminBrandPage';
import AdminBrandEditPage from '@/pages/admin/brand/AdminBrandEditPage';
import AdminCategoryCreatePage from '@/pages/admin/category/AdminCategoryCreatePage';
import AdminCategoryEditPage from '@/pages/admin/category/AdminCategoryEditPage';
import AdminCategoryPage from '@/pages/admin/category/AdminCategoryPage';
import AdminCategoryConfigPage from '@/pages/admin/category/AdminCategoryConfigPage';
import TestCateConfigManagementPage from '@/pages/admin/category/TestCateConfigManagementPage';
import AdminProductsPage from '@/pages/admin/product/AdminProductsPage';
import { Routes, Route } from 'react-router-dom';
import AdminProductGroupPage from '@/pages/admin/product/AdminProductGroupPage';
import AdminProductGroupDetailsPage from '@/pages/admin/product/AdminProductGroupDetailsPage';
import AdminProductEditPage from '@/pages/admin/product/AdminProductEditPage';
import AdminProductGroupCreatePage from '@/pages/admin/product/AdminProductGroupCreatePage';
import AdminProductGroupEditPage from '@/pages/admin/product/AdminProductGroupEditPage';
import UserManagementPage from '@/components/admin/UserManagement';
import CouponManagementPage from '@/pages/admin/CouponManagementPage';
import AdminReviewsCommentsPage from '@/components/admin/AdminReviewsCommentsPage';
import OrderManagementPage from '@/pages/admin/order/OrderManagementPage';
import OrderDetailPage from '@/pages/admin/order/OrderDetailPage';

export default function AdminSubRoutes() {
    return (
        <Routes>
            <Route index element={<AdminDashboardPage />} /> {/* path: /admin */}
            <Route path='dashboard' element={<AdminDashboardPage />} />
            {/* Products group */}
            <Route path='products/' element={<AdminProductsPage />} />
            <Route path='products/edit/:slug' element={<AdminProductEditPage />} />
            <Route path='products/groups' element={<AdminProductGroupPage />} />
            <Route path='products/groups/create' element={<AdminProductGroupCreatePage />} />
            <Route path='products/groups/:groupId' element={<AdminProductGroupDetailsPage />} />
            <Route path='products/groups/edit/:groupId' element={<AdminProductGroupEditPage />} />
            {/* Categories group */}
            <Route path='categories/' element={<AdminCategoryPage />} />
            <Route path='categories/edit/:id' element={<AdminCategoryEditPage />} />
            <Route path='categories/create' element={<AdminCategoryCreatePage />} />
            <Route path='categories/config/:id' element={<AdminCategoryConfigPage />} />
            <Route
                path='categories/manageConfig/:slug'
                element={<TestCateConfigManagementPage />}
            />
            {/* Brands group */}
            <Route path='brands/' element={<AdminBrandPage />} />
            <Route path='brands/create' element={<CreateBrandPage />} />
            <Route path='brands/edit/:id' element={<AdminBrandEditPage />} />
            {/* Dashboard group */}
            <Route path='dashboard' element={<AdminDashboardPage />} />
            {/* User management group */}
            <Route path='users' element={<UserManagementPage />} />Ơ
            {/* Reviews & Comments management group */}
            <Route path='reviews-comments' element={<AdminReviewsCommentsPage />} />
            {/* coupons management group */}
            <Route path='coupons' element={<CouponManagementPage />} />

            {/* Order management */}
            <Route path="/orders" element={<OrderManagementPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
    );
}
