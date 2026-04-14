import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

const BuyNowButton = ({ product, quantity, unavailable, className, disabled }) => {
    const navigate = useNavigate();

    // Kiểm tra token trong localStorage
   

    const handleBuyNow = () => {
        if (!product) return;
        if (unavailable || disabled) return;

         const token = localStorage.getItem('token');

        if (!token) {
            // Nếu chưa login, chuyển sang trang login 
            // và gửi kèm cái "địa chỉ" trang hiện tại (location.pathname)
            navigate('/login', { 
                state: { from: window.location.pathname } 
            });
            return;
        }

        // Đóng gói dữ liệu gửi sang Checkout
        const checkoutData = {
            items: [{
                id: Date.now(),
                productId: product.id,
                quantity: quantity,
                // name: product.name,
                product: {
                variantName: product.variantName || product.name,
                salePrice: product.salePrice, 
                image: product.image
            }
            }],
            isBuyNow: true,
        };

        navigate('/checkout', { state: checkoutData });
    };

    return (
        <button
            type="button"
            disabled={disabled || unavailable}
            onClick={handleBuyNow}
            // Sử dụng className được truyền từ trang ProductDetail vào
            className={className}
        >
            <FontAwesomeIcon icon={faBolt} />
            Buy Now
        </button>
    );
};

export default BuyNowButton;