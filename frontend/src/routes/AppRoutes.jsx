import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import UserRoutes from './UserRoutes';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/profile/*' element={<UserRoutes />} />
        </Routes>
    );
}
