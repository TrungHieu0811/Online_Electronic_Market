import {BrowserRouter, Routes, Route} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/layout/ScrollToTop';
import {useEffect} from 'react';

export default function App() {
	useEffect(() => {
		document.title = 'ElectroMart';
	}, []);
	return (
		<BrowserRouter>
			<ScrollToTop />
			<MainLayout>
				<AppRoutes />
			</MainLayout>
		</BrowserRouter>
	);
}
