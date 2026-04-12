import React from 'react';
import Swal from 'sweetalert2';
import {cartService} from '../../../services/cartService';
import {useCart} from '../../../context/CartContext';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faShield, faCartPlus, faBan, faStar, faStarHalfStroke, faImage} from '@fortawesome/free-solid-svg-icons';

const AddToCartButton = ({productId, quantity, stock, product, className, showText = true, disabled = false}) => {
	// const { addToCartLocal } = useCart();
	const {cartItems, fetchCartCount} = useCart();

	const handleAddToCart = async (e) => {
		if (e) e.stopPropagation();
		if (disabled) return;

		const token = localStorage.getItem('token');

		// 1. Tính toán số lượng đang có (trong Context hoặc LocalStorage)
		let quantityInCart = 0;
		if (token) {
			// Với User, tạm thời vẫn dùng Context hoặc bạn có thể in ra console để debug
			const existingItem = cartItems?.find((item) => item.product.id === productId);
			quantityInCart = existingItem ? existingItem.quantity : 0;
		} else {
			// VỚI KHÁCH: Đọc trực tiếp từ LocalStorage giúp logic chính xác 100%
			const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
			const existingGuestItem = guestCart.find((item) => item.productId === productId);
			quantityInCart = existingGuestItem ? existingGuestItem.quantity : 0;
		}

		const totalWillHave = quantityInCart + quantity;

		// 2. Validate tồn kho
		if (stock !== undefined && totalWillHave > stock) {
			if (quantityInCart >= stock) {
				// Trường hợp trong giỏ đã có tối đa rồi
				Swal.fire({
					icon: 'info',
					title: 'Items already in cart',
					text: `You already have the maximum available stock (${stock} units) in your cart.`,
					confirmButtonColor: '#3085d6',
				});
			} else {
				// Trường hợp thêm vào sẽ bị quá
				Swal.fire({
					icon: 'warning',
					title: 'Limited Stock',
					text: `You have ${quantityInCart} in cart. We only have ${stock} units total. We've updated your cart to the maximum available.`,
					confirmButtonColor: '#3085d6',
				});
			}
			return;
		}

		// 3. XỬ LÝ LƯU GIỎ HÀNG
		if (!token) {
			// KHÁCH: Lưu vào LocalStorage
			let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
			const existingIndex = guestCart.findIndex((item) => item.productId === productId);

			if (existingIndex > -1) {
				guestCart[existingIndex].quantity = totalWillHave;
			} else {
				guestCart.push({productId, quantity, product: product});
			}

			localStorage.setItem('guestCart', JSON.stringify(guestCart));

			fetchCartCount();

			Swal.fire({
				icon: 'success',
				title: 'Saved to temporary cart!',
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 2000,
			});
			return;
		}

		// USER ĐÃ LOGIN: Gọi API
		try {
			await cartService.addToCart(productId, quantity);
			await fetchCartCount();
			Swal.fire({
				icon: 'success',
				title: 'Added to cart!',
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 1500,
			});
		} catch (error) {
			Swal.fire({
				icon: 'error',
				title: 'Oops...',
				text: error.response?.data?.message || 'Failed to add to cart',
			});
		}
	};

	return (
		<button
			onClick={handleAddToCart}
			disabled={disabled || (stock !== undefined && stock <= 0)}
			className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-blue-600 transition-all
            ${
													disabled || stock <= 0
														? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
														: 'text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95'
												}`}
		>
			<FontAwesomeIcon icon={faCartPlus} />
			Add to Cart
		</button>
	);
};

export default AddToCartButton;
