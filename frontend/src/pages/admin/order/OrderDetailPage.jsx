import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderManagementService } from '../../../services/orderManagementService';
import OrderTimeline from '../../../components/admin/order/OrderTimeline';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Swal from 'sweetalert2';
import { ChevronLeft, PhoneCall, CreditCard, ClipboardList } from 'lucide-react';

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ order: null, history: [], verify: [], payments: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetail = async () => {
            try {
                const [o, h, v, p] = await Promise.all([
                    orderManagementService.getOrderById(orderId),
                    orderManagementService.getOrderHistory(orderId),
                    orderManagementService.getVerifyHistory(orderId),
                    orderManagementService.getPaymentLogs(orderId)
                ]);
                setData({ order: o.data, history: h.data, verify: v.data, payments: p.data });
            } catch (e) {
                console.error("Error loading order details:", e);
            } finally {
                setLoading(false);
            }
        };
        loadDetail();
    }, [orderId]);

    const onAction = async (status) => {
        const { value: reason } = await Swal.fire({
            title: `Confirm ${status}?`,
            input: 'text',
            inputPlaceholder: 'Enter reason (optional)',
            showCancelButton: true,
            confirmButtonColor: status === 'CANCELLED' ? '#e11d48' : '#059669'
        });
        
        if (reason !== undefined) {
            await orderManagementService.changeStatus(orderId, status, reason);
            window.location.reload();
        }
    };

    if (loading) return <div className="flex min-h-screen bg-slate-50"><AdminSidebar /><main className="flex-1"><AdminHeader /><p className="p-10">Loading...</p></main></div>;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />

            <main className="flex-1 flex flex-col min-w-0">
                <AdminHeader />

                <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
                    {/* Nút quay lại và Tiêu đề */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/orders')}
                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Order #EM-{orderId}</h1>
                            <p className="text-sm text-slate-500 italic uppercase">{data.order?.orderStatus} • {data.order?.paymentStatus}</p>
                        </div>
                    </div>

                    {/* Thanh hành động nhanh */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
                                <p className="text-sm text-slate-600 font-medium">Update current order status</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => onAction('CONFIRMED')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md">Confirm Order</button>
                            <button onClick={() => onAction('SHIPPING')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md">Start Shipping</button>
                            <button onClick={() => onAction('CANCELLED')} className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-5 py-2 rounded-xl font-bold transition-all">Cancel</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cột trái: Thông tin chính */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Thông tin khách hàng */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-400 uppercase mb-4">Customer Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Full Name</p>
                                        <p className="font-bold text-slate-800">{data.order?.user?.fullname}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Phone Number</p>
                                        <p className="font-bold text-slate-800">{data.order?.phone}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-400 uppercase">Shipping Address</p>
                                        <p className="font-bold text-slate-800">{data.order?.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline lịch sử xử lý */}
                            <OrderTimeline history={data.history} />
                        </div>

                        {/* Cột phải: Thanh toán & Xác minh */}
                        <div className="space-y-8">
                            {/* Nhật ký cuộc gọi */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <PhoneCall size={18} className="text-blue-500" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase">Call Verification</h3>
                                </div>
                                <div className="space-y-4">
                                    {data.verify.length > 0 ? data.verify.map(v => (
                                        <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-black text-slate-800 uppercase">{v.status}</span>
                                                <span className="text-[10px] text-slate-400">Attempt #{v.attemptNumber}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed italic">"{v.note}"</p>
                                        </div>
                                    )) : <p className="text-xs text-slate-400 text-center italic">No calls logged yet.</p>}
                                </div>
                            </div>

                            {/* Thông tin thanh toán */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <CreditCard size={18} className="text-emerald-500" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase">Payment Evidence</h3>
                                </div>
                                {data.payments.length > 0 ? data.payments.map(p => (
                                    <div key={p.id} className="text-xs space-y-2">
                                        <p className="flex justify-between">
                                            <span className="text-slate-400">Provider:</span>
                                            <span className="font-bold text-slate-800">{p.provider}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-slate-400">Status:</span>
                                            <span className="text-emerald-600 font-bold">{p.status}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-300 break-all bg-slate-50 p-2 rounded">
                                            ID: {p.transactionId}
                                        </p>
                                    </div>
                                )) : <p className="text-xs text-slate-400 text-center italic">Payment via COD (Cash on Delivery)</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderDetailPage;