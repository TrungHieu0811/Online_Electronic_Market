import {Routes, Route} from 'react-router-dom';
import ProductSearchPage from '@/pages/user/products/ProductSearchPage';
import ProductDetailPage from '@/pages/user/products/ProductDetailPage';

export default function ProductRoutes() {
	return (
		<Routes>
			<Route path="/:slug" element={<ProductDetailPage />} />
			<Route path="/search" element={<ProductSearchPage />} />
		</Routes>
	);
}
