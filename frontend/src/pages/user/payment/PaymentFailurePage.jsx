import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentFailurePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId'); // Lấy từ URL redirect của Backend

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center">
            <span className="material-symbols-outlined text-red-500 text-9xl mb-6 animate-bounce">
                error
            </span>
            <h1 className="text-4xl font-black text-slate-900 uppercase mb-4 tracking-tight">
                Payment Failed
            </h1>
            <p className="text-slate-500 max-w-lg mb-10 leading-relaxed font-medium">
                {orderId ? `Transaction for Order #${orderId} was not completed.` : "The payment process was interrupted or encountered an error."}
                <br />
                <span className="text-orange-600 font-bold">Your order has been automatically cancelled, and any applied coupons or stock have been restored.</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
                <button 
                    onClick={() => navigate('/cart')}
                    className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-xl active:scale-95"
                >
                    Return to Cart
                </button>
                <button 
                    onClick={() => navigate('/profile/orders')}
                    className="px-8 py-4 border-2 border-slate-200 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest active:scale-95"
                >
                    View My Orders
                </button>
            </div>
        </div>
    );
}