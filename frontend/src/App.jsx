import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';

export default function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <AppRoutes />
            </MainLayout>
        </BrowserRouter>
    );
}
