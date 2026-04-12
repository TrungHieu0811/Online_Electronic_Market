import {Routes, Route} from 'react-router-dom';
import CategoryPage from '@/pages/user/products/CategoryPage';

export default function CategoryRoutes() {
	return (
		<Routes>
			<Route path="/:slug" element={<CategoryPage />} />
		</Routes>
	);
}
