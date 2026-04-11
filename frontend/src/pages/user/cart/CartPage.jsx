import React, { useState, useEffect } from 'react';
import CartItem from '../../../components/user/cart/CartItem';
import { cartService } from '../../../services/cartService';
import { TbArrowNarrowRightDashed } from "react-icons/tb";
import Swal from 'sweetalert2';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartService.getMyCart();
      
      setCartItems(response.data);
    } catch (error) {
      console.error("We’re having trouble loading your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await cartService.toggleSelection(id);
      fetchCart(); // Tải lại data để cập nhật trạng thái
    } catch (error) {
      alert("Failed to update cart selection. Please try again.");
    }
  };

  const handleUpdate = async (id, newQty) => {
    if (newQty === 0) {
        handleRemove(id);
        return;
    }
    try {
      await cartService.updateQuantity(id, newQty);
      fetchCart();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Out of Stock',
        text: 'Sorry, we don’t have enough items in stock.',
        confirmButtonColor: 'primary', // Màu accent-blue của Ngọc
      });
    }
  };

  const handleRemove = async (id) => {
   const result = await Swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Màu đỏ cho nút xóa
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await cartService.removeItem(id);
        fetchCart();
        Swal.fire({
            title: 'Deleted!',
            text: 'Your item has been removed.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Error!', 'Could not remove the item.', 'error');
      }
    }
  };


const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
const selectedItems = safeCartItems.filter(item => item.isSelected);

const subtotal = selectedItems.reduce((acc, item) => 
    acc + (item.product.salePrice * item.quantity), 0
);
  // TÍNH TOÁN: Chỉ tính tiền cho những món được check (isSelected = true)
  const tax = subtotal > 0 ? 12.50 : 0;
  const total = subtotal + tax;

  if (loading) return <div className="p-20 text-center">Loading your cart...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-6 lg:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-black mb-10 tracking-tight">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.length > 0 ? (
              cartItems.map(item => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-xl text-center border border-dashed border-slate-300">
                Your shopping cart is empty. <a href="/" className="text-primary font-bold underline hover:text-blue-700 transition-colors ml-1">Back to Shop!</a>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-slate-100 dark:border-slate-800 sticky top-8">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({selectedItems.length} items selected)</span>
                  <span className="font-medium text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-slate-900 dark:text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col space-y-4 mt-6">
                <button
                  disabled={selectedItems.length === 0}
                  className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    selectedItems.length > 0 ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Proceed to Checkout</span>
                  <span className="material-symbols-outlined"><TbArrowNarrowRightDashed size={28} className="ml-1" /></span>
                </button>

                <button
                  onClick={() => navigate('/')} // Quay lại trang chủ hoặc danh mục sản phẩm
                  className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                >
                    Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;