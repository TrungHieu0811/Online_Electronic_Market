import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';
import Swal from 'sweetalert2';

export const useAuthActionMergeCart = () => {
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();

    const handleLoginOrRegisterSuccess = async (token) => {
        // 1. Lưu Token ngay lập tức để các request API sau đó (như merge) có quyền truy cập
        localStorage.setItem('token', token);

        // 2. Xử lý đồng bộ giỏ hàng từ LocalStorage lên Database
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        
        if (guestCart.length > 0) {
            try {
                // Chỉ lấy dữ liệu cần thiết để gửi lên server
                const mergeData = guestCart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }));

                await cartService.mergeCart(mergeData);
                
                // Xóa giỏ hàng tạm sau khi merge thành công
                localStorage.removeItem('guestCart');
            } catch (error) {
                console.error("Failed to merge guest cart during auth:", error);
            }
        }

        // 3. Cập nhật lại số lượng giỏ hàng trên UI (Header)
        await fetchCartCount();

        // 4. Thông báo thành công và điều hướng về trang chủ
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'success',
            title: 'Successfully authenticated!'
        });

        navigate('/');
    };

    return { handleLoginOrRegisterSuccess };
};