import React from 'react';
import { FaRegTrashCan } from "react-icons/fa6";

const CartItem = ({ item, onToggle, onUpdate, onRemove }) => {

  console.log("Attributes của sản phẩm:", item.product.attributes);
  // Tìm thuộc tính màu sắc trong mảng attributes
  const colorValue = item.product.attributes?.find(a => a.name === "color")?.attrValue || "Default";
  const romValue = item.product.attributes?.find(a => a.name === "ROM")?.attrValue || "";
  
  // Lấy tên thương hiệu (Giả sử trong product có object brand như log Hibernate trước đó)
  const brandName = item.product.group?.brand?.name || "ElectroMart";


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

      <div className="w-32 h-32 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
        <img className="w-full h-full object-contain p-2" src={item.product.image} alt={item.product.variantName} />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.product.variantName}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase">
        {colorValue} {romValue && `- ${romValue}`} | {brandName}
      </p>
        
        <div className="mt-4 flex items-center justify-center sm:justify-start gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined text-lg">-</span>
            </button>
            <span className="w-10 text-center text-slate-900 dark:text-white font-semibold">
              {item.quantity}
            </span>
            <button 
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined text-lg">+</span>
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