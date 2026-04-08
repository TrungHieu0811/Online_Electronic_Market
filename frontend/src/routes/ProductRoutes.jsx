import { Routes, Route } from 'react-router-dom';
import RateOrderPage from '@/features/user/profile/pages/RateOrderPage';
import ProductDetailPage from '@/components/productComponents/ProductDetailPage';
import CategoryPage from '@/pages/user/products/CategoryPage';

export default function ProductRoutes() {
    return (
        <Routes>
            <Route path="/:slug" element={<ProductDetailPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>
    );
}
