import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        // Xóa giỏ hàng local vì đã thanh toán xong
        localStorage.removeItem('checkoutItems');
        
        Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: `Order #${orderId} has been paid and confirmed.`,
            confirmButtonText: 'View My Orders'
        }).then(() => {
            navigate('/profile/orders');
        });
    }, []);

    return <div className="min-h-screen flex items-center justify-center">Processing your payment result...</div>;
};

export default PaymentSuccessPage;