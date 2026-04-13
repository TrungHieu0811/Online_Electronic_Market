import React, {useState, useEffect} from 'react';
import CartItem from '../../../components/user/cart/CartItem';
import {cartService} from '../../../services/cartService';
import {TbArrowNarrowRightDashed} from 'react-icons/tb';
import Swal from 'sweetalert2';
import {useCart} from '../../../context/CartContext';
import {useNavigate} from 'react-router-dom';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [selectedIds, setSelectedIds] = usedState([]);
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
    const selectedIds = cartItems.filter(item => item.isSelected).map(i => i.id);
    // const selectedItems = cartItems.filter(item => item.isSelected);
    // if (selectedIds.length === 0) return;

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

export default CartPage;
