import {Routes, Route} from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';
import ProductRoutes from './ProductRoutes';
import ScrollToTop from '@/components/layout/ScrollToTop';

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/products/*" element={<ProductRoutes />} />
			<Route path="/profile/*" element={<UserRoutes />} />
		</Routes>
	);
}
