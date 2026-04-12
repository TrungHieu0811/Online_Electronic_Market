import { Routes, Route } from 'react-router-dom';
import RateOrderPage from '@/features/user/profile/pages/RateOrderPage';

export default function UserRoutes() {
    return (
        <Routes>
            <Route path='orders/:orderId/review' element={<RateOrderPage />} />
           
        </Routes>
    );
}
