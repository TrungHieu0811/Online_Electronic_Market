import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState([]);

    // 1. Hàm lấy số lượng từ Backend (dùng API /count như đã bàn)
    const fetchCartCount = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            // ĐỐI VỚI USER
            try {
                // 1. Lấy số lượng badge
                const resCount = await cartService.getCartCount();
                setCartCount(resCount.data);

                // 2. Lấy chi tiết để các component khác (như AddToCartButton) check stock
                const resFull = await cartService.getFullCartDetails();
                setCartItems(resFull.data);
            } catch (err) {
                console.log("Lỗi lấy giỏ hàng user:", err);
            }
        } else {
            // ĐỐI VỚI GUEST
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            
            // Tính tổng số lượng hiển thị trên Badge
            const total = guestCart.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(total);
            
            // Lưu danh sách guest để so sánh stock
            setCartItems(guestCart);
        }
    };

    useEffect(() => {
        fetchCartCount();
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, cartItems, fetchCartCount}}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);