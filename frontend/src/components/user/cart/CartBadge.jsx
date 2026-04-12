import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

const CartBadge = () => {
  const { cartCount } = useCart();

  // Logic hiển thị 99+
  const displayCount = cartCount > 99 ? '99+' : cartCount;

  return (
    <div className='relative flex items-center gap-2 hover:text-[#045fae]'>
      <ShoppingCart className='h-6 w-6' />
      {cartCount > 0 && (
        <span className='absolute -right-2 -top-2 rounded-full bg-[#FFD700] px-1.5 py-0.5 text-[10px] font-bold text-[#045fae] border border-white'>
          {displayCount}
        </span>
      )}
      <span className='hidden text-sm font-medium md:block'>Cart</span>
    </div>
  );
};

export default CartBadge;