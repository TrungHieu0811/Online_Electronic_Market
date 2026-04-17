import {BrowserRouter, Routes, Route} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './components/layout/ScrollToTop';
import {useEffect} from 'react';
import ChatBox from './components/user/ChatBox';

export default function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<AppRoutes />
			<ChatBox />
			<ToastContainer position="bottom-right" autoClose={3000} />
		</BrowserRouter>
	);
}
