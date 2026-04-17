import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function OrderDetailPage() {
    const { id } = useParams(); // Lấy từ route /profile/orders/:id
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            console.log("Đang tải đơn hàng ID:", id); // Kiểm tra xem useParams có lấy được ID không
            if (!id) return;

            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Gọi đồng thời 2 API
                const [orderRes, itemsRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/users/orders/${id}`, { headers }),
                    axios.get(`http://localhost:8080/api/users/order-details/${id}`, { headers })
                ]);

                console.log("Dữ liệu Đơn hàng nhận được:", orderRes.data);
                console.log("Dữ liệu Sản phẩm nhận được:", itemsRes.data);

                setOrder(orderRes.data);
                
                // Kiểm tra data trả về có phải là mảng không trước khi set
                if (itemsRes.data && Array.isArray(itemsRes.data)) {
                    setItems(itemsRes.data);
                } else {
                    setItems([]);
                }
            } catch (error) {
                console.error("Lỗi fetch chi tiết:", error);
                const errorMsg = error.response?.data?.message || error.message;
                Swal.fire('Error', `Could not load order details: ${errorMsg}`, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);
    console.log("items: ",items);

    // Ngăn chặn việc render khi chưa có dữ liệu hoặc đang load
    if (loading) return <div className="p-20 text-center font-bold text-slate-500 text-xl animate-pulse">Loading order info...</div>;
    if (!order) return <div className="p-20 text-center text-red-500 font-bold">Order not found (ID: {id})</div>;

    return (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white shadow-2xl rounded-3xl border border-slate-100">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Order Details</h2>
                    <p className="text-slate-400 font-bold mt-1">Order ID: #{order.id}</p>
                </div>
                <span className="px-5 py-2 rounded-full text-xs font-black bg-blue-100 text-blue-600 uppercase shadow-sm">
                    {order.orderStatus}
                </span>
            </div>

            <div className="mb-10 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Purchased Items</h3>
                {items && items.length > 0 ? items.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-20 h-20 bg-white rounded-xl p-1 border">
                             <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080/uploads${item.imageUrl}`} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.product?.variantName || "Product"}</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-black text-xl text-slate-900">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">${item.priceAtPurchase?.toFixed(2)} / unit</p>
                        </div>
                    </div>
                )) : (
                    <div className="p-10 border-2 border-dashed rounded-2xl text-center text-slate-400 italic">
                        No product items found for this order.
                    </div>
                )}
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
                <div className="flex justify-between opacity-60 text-[10px] font-black uppercase tracking-widest"><span>Subtotal</span><span>${order.totalBasePrice?.toFixed(2)}</span></div>
                <div className="flex justify-between opacity-60 text-[10px] font-black uppercase tracking-widest"><span>Shipping Fee</span><span>${order.shippingFee?.toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-green-400 text-[10px] font-black uppercase tracking-widest"><span>Discount</span><span>-${order.discountAmount?.toFixed(2)}</span></div>}
                <div className="flex justify-between items-center pt-5 border-t border-slate-800">
                    <span className="text-lg font-black uppercase tracking-widest text-slate-400">Total Paid</span>
                    <span className="text-5xl font-black text-orange-500 tracking-tighter">${order.totalPayPrice?.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}