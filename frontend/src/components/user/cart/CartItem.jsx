import React from 'react';
import { FaRegTrashCan } from "react-icons/fa6";
import { Link } from 'react-router-dom';

const CartItem = ({ item, onToggle, onUpdate, onRemove }) => {
  const product = item?.product;
  // Tìm thuộc tính màu sắc trong mảng attributes
  const colorValue = product?.attributes?.find(a => a.name === "color")?.attrValue || "Default";
  const romValue = product?.attributes?.find(a => a.name === "ROM")?.attrValue || "";
  
  // Lấy tên thương hiệu (Giả sử trong product có object brand như log Hibernate trước đó)
  const brandName = product?.group?.brand?.name || "ElectroMart";

  // Tạo đường dẫn chi tiết sản phẩm
  // Nếu item của bạn không có slug, hãy dùng item.product.id
  const productDetailPath = `/products/${product?.slug || product?.id}`;

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Nếu xóa hết (trống), tạm thời để trống để user nhập tiếp
    if (value === '') {
      onUpdate(item.id, '');
      return;
    }

    let newQty = parseInt(value);
    const stock = product?.stockQuantity || 0;

    // Validate giá trị nhập
    if (isNaN(newQty) || newQty < 1) {
      newQty = 1;
    } else if (newQty > stock) {
      newQty = stock; // Ép về số lượng tối đa trong kho
    }

    onUpdate(item.id, newQty);
  };

  if (!product) return <div className="p-4 border rounded-xl bg-red-50 text-red-500">Product data missing</div>;
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
      {/* Checkbox Select Box */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={() => onToggle(item.id)}
          className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
        />
      </div>

      <Link 
        to={productDetailPath}
        className="w-32 h-32 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 hover:opacity-80 transition-opacity"
      >
        <img 
          className="w-full h-full object-contain p-2" 
          src={item.product.image} 
          alt={item.product.variantName} 
        />
      </Link>

      <div className="flex-1 text-center sm:text-left">
        <Link 
          to={productDetailPath} 
          className="group transition-all duration-300 ease-in-out"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary group-hover:underline decoration-2 underline-offset-4 decoration-primary/30">
            {item.product.variantName}
          </h3>
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase">
        {colorValue} {romValue && `- ${romValue}`} | {brandName}
      </p>
        
        <div className="mt-4 flex items-center justify-center sm:justify-start gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {/* Nút Trừ */}
            <button 
              onClick={() => onUpdate(item.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-600"
            >
              <span className="text-lg">-</span>
            </button>

            {/* Ô Nhập Số trực tiếp */}
            <input
              type="number"
              value={item.quantity}
              onChange={handleInputChange}
              onBlur={() => { if (item.quantity === '') onUpdate(item.id, 1); }} // Nếu click ra ngoài khi đang trống thì về 1
              className="w-12 bg-transparent text-center text-slate-900 dark:text-white font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            {/* Nút Cộng */}
            <button
              onClick={() => onUpdate(item.id, Math.min(product.stockQuantity, item.quantity + 1))}
              disabled={item.quantity >= product.stockQuantity}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all
                ${item.quantity >= product.stockQuantity ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-700'}`}
            >
              <span className="text-lg">+</span>
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-xl"><FaRegTrashCan /></span>
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-bold text-primary">
          ${(item.product.salePrice * item.quantity).toFixed(2)}
        </p>
        <p className="text-xs text-slate-400 mt-1">${item.product.salePrice} each</p>
      </div>
    </div>
  );
};

export default CartItem;