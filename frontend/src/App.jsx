import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './components/layout/ScrollToTop';

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
            <ToastContainer position="bottom-right" autoClose={3000} />
        </BrowserRouter>

    );
}
