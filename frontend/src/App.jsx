import {BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './components/layout/ScrollToTop';
import {useEffect} from 'react';
import ChatBox from './components/user/chatBox/ChatBox';

const ConditionalChatBox = () => {
    const location = useLocation();

    // Không hiện ở trang admin
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    // Trả về thẳng ChatBox, các class bên trong ChatBox.css sẽ lo việc hiển thị nổi lên
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
