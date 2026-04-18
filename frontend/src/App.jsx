import {BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './components/layout/ScrollToTop';
import {useEffect} from 'react';
import ChatBox from './components/user/ChatBox';

const ConditionalChatBox = () => {
    const location = useLocation();

    // Nếu đường dẫn bắt đầu bằng /admin thì không hiện Chatbot
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    return <ChatBox />;
};

export default function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<AppRoutes />
			<ConditionalChatBox />
			<ToastContainer position="bottom-right" autoClose={3000} />
		</BrowserRouter>
	);
}
