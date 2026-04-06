import {BrowserRouter, Routes, Route} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/layout/ScrollToTop';

export default function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<MainLayout>
				<AppRoutes />
			</MainLayout>
		</BrowserRouter>
	);
}
