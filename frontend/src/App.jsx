import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <AppRoutes />
            </MainLayout>
            {/* 👉 Đặt cái loa thông báo ở góc dưới bên phải */}
            <ToastContainer position="bottom-right" autoClose={3000} />
        </BrowserRouter>

    );
}
