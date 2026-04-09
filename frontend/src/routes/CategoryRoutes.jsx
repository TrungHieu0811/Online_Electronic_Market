import {Routes, Route} from 'react-router-dom';
import RateOrderPage from '@/features/user/profile/pages/RateOrderPage';
import ProductDetailPage from '@/components/productComponents/ProductDetailPage';
import CategoryPage from '@/pages/user/products/CategoryPage';
import TestCateConfigManagementPage from '@/pages/user/products/TestCateConfigManagementPage';

export default function CategoryRoutes() {
	return (
		<Routes>
			<Route path="/:slug" element={<CategoryPage />} />
			<Route path="/manageConfig/:slug" element={<TestCateConfigManagementPage />} />
		</Routes>
	);
}
