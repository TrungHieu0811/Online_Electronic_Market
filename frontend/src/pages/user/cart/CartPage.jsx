import React, { useState, useEffect } from 'react';
import CartItem from '../../../components/user/cart/CartItem';
import { cartService } from '../../../services/cartService';
import { TbArrowNarrowRightDashed } from "react-icons/tb";
import Swal from 'sweetalert2';
import { useCart } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    const token = localStorage.getItem('token');
    
    if (token) {
        // ĐÃ LOGIN: Lấy từ Server như cũ
        try {
            const response = await cartService.getFullCartDetails();
            setCartItems(response.data);
        } catch (error) {
            console.error("We’re having trouble loading your cart. Please try again.", error);
        }
    } else {
        // CHƯA LOGIN: Lấy từ localStorage (Guest Cart)
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        
        const mappedItems = guestCart.map(item => ({
            ...item,
            id: `guest-${item.productId}`,
            isSelected: true
        }));
        
        setCartItems(mappedItems);
    }
    setLoading(false);
  };

  const handleToggle = async (id) => {
    const token = localStorage.getItem('token');

    if (!token) {
        // CHẾ ĐỘ KHÁCH: Xử lý tại local
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        
        // Vì ở CartPage bạn map id là `guest-${productId}`, nên ta cần lấy lại productId xịn
        const productId = typeof id === 'string' ? parseInt(id.replace('guest-', '')) : id;

        const updatedCart = guestCart.map(item => {
            if (item.productId === productId) {
                // Đảo ngược trạng thái isSelected (nếu localStorage chưa có thì mặc định là true)
                return { ...item, isSelected: !(item.isSelected ?? true) };
            }
            return item;
        });

        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        fetchCart(); // Cập nhật lại giao diện ngay lập tức
        return;
    }
    try {
      await cartService.toggleSelection(id);
      fetchCart(); // Tải lại data để cập nhật trạng thái
    } catch (error) {
      alert("Failed to update cart selection. Please try again.");
    }
  };

  const handleUpdate = async (id, newQty) => {

    const token = localStorage.getItem('token');
    // Tìm item hiện tại để lấy stockQuantity
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    // Nếu người dùng đang xóa trắng để nhập số mới, chỉ cập nhật UI, ĐỪNG gọi API
    if (newQty === '' || newQty === null) {
        setCartItems(prev => prev.map(it => it.id === id ? { ...it, quantity: '' } : it));
        return;
    }

    // Đảm bảo newQty là số nguyên hợp lệ trước khi xử lý tiếp
    const parsedQty = parseInt(newQty);
   if (isNaN(parsedQty) || parsedQty < 0) return;

    if (parsedQty === 0) {
        handleRemove(id);
        return;
    }

    const stock = item.product?.stockQuantity || 0;
    if (parsedQty > stock) {
        Swal.fire({
            icon: 'info',
            title: 'Stock Limit',
            text: `Sorry, we only have ${item.product.stockQuantity} items in stock.`,
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 2000
        });
        parsedQty = stock;
    }

    if (!token) {
        // CHẾ ĐỘ KHÁCH
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const productId = typeof id === 'string' ? parseInt(id.replace('guest-', '')) : id;

        const updatedCart = guestCart.map(i =>
            i.productId === productId ? { ...i, quantity: parsedQty } : i
        );

        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        fetchCart();
        fetchCartCount();
    } else {
        // CHẾ ĐỘ USER: Gọi API
        try {
            // Dùng parsedQty đã được xử lý thay vì newQty
            await cartService.updateQuantity(id, parsedQty);
            fetchCart();
        } catch (error) {
            console.error("Update failed", error);
            // Nếu API lỗi (500), load lại giỏ hàng để hoàn tác UI về giá trị cũ trong DB
            fetchCart();
        }
    }
  };

  const { fetchCartCount } = useCart();

  // Kiểm tra xem tất cả các món hiện tại đã được chọn chưa
  const isAllSelected = cartItems.length > 0 && cartItems.every(item => item.isSelected);

  const handleSelectAll = async () => {
        const targetState = !isAllSelected; // Đảo trạng thái hiện tại
        const token = localStorage.getItem('token');

    if (!token) {
        // CHẾ ĐỘ KHÁCH
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const updatedCart = guestCart.map(item => ({ ...item, isSelected: targetState }));
        
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        fetchCart();
        return;
    }
        try {
            // Gọi API toggle-all mới viết ở trên
            await cartService.toggleAll(targetState);
            // Load lại giỏ hàng để cập nhật UI
            fetchCart(); 
        } catch (error) {
            Swal.fire('Error', 'Could not toggle all items', 'error');
        }
  };

  const handleDeleteSelected = async () => {
    // const selectedIds = cartItems.filter(item => item.isSelected).map(i => i.id);
    const selectedItems = cartItems.filter(item => item.isSelected);
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
        title: 'Confirm Delete',
        text: `Are you sure you want to remove  ${selectedItems.length} the selected items? `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');

        if (!token) {
            // CHẾ ĐỘ KHÁCH
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            // Lọc ra những item KHÔNG được chọn (giữ lại những item isSelected: false)
            const updatedCart = guestCart.filter(item => !item.isSelected);
            
            localStorage.setItem('guestCart', JSON.stringify(updatedCart));
            fetchCart();
            fetchCartCount();
            Swal.fire('Deleted!', 'Selected items removed.', 'success');
            return;
        }

        try {
            await cartService.removeMultipleItems(selectedIds);
            
            // Cập nhật lại giao diện và số lượng trên Header
            fetchCart(); 
            fetchCartCount(); 
            
            Swal.fire('Deleted!', 'All selected items have been removed.', 'success');
        } catch (error) {
            Swal.fire('Error', 'Could not remove selected items', 'error');
        }
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
      const token = localStorage.getItem('token');

        if (!token) {
            // CHẾ ĐỘ KHÁCH
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const productId = typeof id === 'string' ? parseInt(id.replace('guest-', '')) : id;

            const updatedCart = guestCart.filter(i => i.productId !== productId);
            localStorage.setItem('guestCart', JSON.stringify(updatedCart));
            
            fetchCart();
            fetchCartCount();
            Swal.fire('Deleted!', 'Item removed from temporary cart.', 'success');
            return;
        }

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
    await fetchCartCount();
  };

 const handleCheckout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    // TRƯỜNG HỢP LÀ GUEST
    Swal.fire({
      title: 'Login Required',
      text: 'Please log in to your account to proceed with the checkout.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#ea580c', 
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Login Now',
      cancelButtonText: 'Maybe Later'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/login');
      }
    });
  } else {
    // TRƯỜNG HỢP LÀ USER:
    // 1. SỬA TẠI ĐÂY: Đổi 'item.selected' thành 'item.isSelected' 
    // cho khớp với log Hibernate "is_selected" từ Backend của bạn
    const selectedItems = cartItems.filter(item => item.isSelected === true);

    // 2. Kiểm tra nếu không chọn món nào
    if (selectedItems.length === 0) {
      Swal.fire({
        title: 'No items selected',
        text: 'Please select at least one product to checkout!',
        icon: 'warning',
        confirmButtonColor: '#ea580c'
      });
      return;
    }

    // 3. Lưu vào localStorage để trang Checkout lấy ra dùng
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    
    // 4. Chuyển sang trang checkout
    navigate('/checkout'); 
  }
};

const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
const selectedItems = safeCartItems.filter(item => item.isSelected);

const subtotal = selectedItems.reduce((acc, item) => {
    const price = item.product?.salePrice || 0;
    return acc + (price * item.quantity);
}, 0);

  // TÍNH TOÁN: Chỉ tính tiền cho những món được check (isSelected = true)
  const tax = subtotal > 0 ? 12.50 : 0;
  const total = subtotal + tax;

  if (loading) return <div className="p-20 text-center">Loading your cart...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-6 lg:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-black mb-10 tracking-tight">Shopping Cart</h1>

        <div className="flex items-center justify-between bg-white p-4 rounded-xl border mb-4">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-5 h-5 cursor-pointer accent-blue-600"
                    />
                    <span className="font-medium text-gray-700">Select All ({cartItems.length} items)</span>
                </div>
                
                {selectedItems.length > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all text-sm font-bold border border-red-100 dark:border-red-900/30"
                    >
                        <span className="material-symbols-outlined text-lg"></span>
                        Remove Selected ({selectedItems.length})
                    </button>
                )}
            </div>

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
                  onClick={handleCheckout} // Thêm dòng này
                  disabled={selectedItems.length === 0}
                  className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    selectedItems.length > 0
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Proceed to Checkout</span>
                  <span className="material-symbols-outlined">
                    <TbArrowNarrowRightDashed size={28} className="ml-1" />
                  </span>
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