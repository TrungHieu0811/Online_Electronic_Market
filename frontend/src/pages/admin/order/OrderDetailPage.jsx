import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderManagementService } from '../../../services/orderManagementService';
import OrderTimeline from '../../../components/admin/order/OrderTimeline';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Swal from 'sweetalert2';
import { ChevronLeft, PhoneCall, CreditCard, ClipboardList } from 'lucide-react';
import axios from 'axios';

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ order: null, history: [], verify: [], payments: [] });
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true);
            // 1. Lấy thông tin đơn hàng TRƯỚC (Cái này quan trọng nhất)
            try {
                const o = await orderManagementService.getOrderById(orderId);
                setData(prev => ({ ...prev, order: o.data }));
            } catch (e) {
                console.error("Error fetching order:", e);
            }

            // 2. Lấy các thông tin phụ sau (Lỗi cái nào thì cái đó trống, không sập trang)
            try {
                const h = await orderManagementService.getOrderHistory(orderId);
                setData(prev => ({ ...prev, history: h.data }));
            } catch (e) { console.error("Error fetching history:", e); }

            try {
                const v = await orderManagementService.getVerifyHistory(orderId);
                setData(prev => ({ ...prev, verify: v.data }));
            } catch (e) { console.error("Error fetching verify:", e); }

            try {
                const p = await orderManagementService.getPaymentLogs(orderId);
                setData(prev => ({ ...prev, payments: p.data }));
            } catch (e) { console.error("Error fetching payments:", e); }

            try {
                const itemRes = await orderManagementService.getOrderItems(orderId);
                setData(prev => ({ ...prev, items: itemRes.data }));
            } catch (e) {
                console.log("Error fetching items:", itemsRes.data);
            }

            try {
                const evidences = await orderManagementService.getOrderEvidences(orderId);
                setData(prev => ({ ...prev, evidences: evidences.data }));
            } catch (error) {
                console.error("Error fetching evidences:", error);
            }

            setLoading(false);
        };
        loadDetail();
    }, [orderId]);

   const onAction = async (status) => {
        let finalReason = "";

        // 1. Nếu là lệnh Hủy, thực hiện quy trình chọn lý do
        if (status === 'CANCELLED') {
            const { value: selectedReason } = await Swal.fire({
                title: 'Cancel Order?',
                text: "Please select a reason for cancelling this order.",
                icon: 'warning',
                input: 'select',
                inputOptions: {
                    'Customer requested cancellation': 'Customer requested cancellation',
                    'Out of stock': 'Out of stock',
                    'Unreachable after 3 attempts': 'Unreachable after 3 attempts',
                    'Suspected fraud': 'Suspected fraud',
                    'Other': 'Other (Manual input)'
                },
                inputPlaceholder: 'Select a reason',
                showCancelButton: true,
                confirmButtonColor: '#e11d48',
                inputValidator: (value) => {
                    if (!value) return 'You must select a reason!';
                }
            });

            if (!selectedReason) return; // Người dùng nhấn Cancel

            finalReason = selectedReason;

            // 2. Nếu chọn "Other", hiện thêm ô nhập Text
            if (selectedReason === 'Other') {
                const { value: textReason } = await Swal.fire({
                    title: 'Specify Reason',
                    input: 'text',
                    inputLabel: 'Provide more details for cancellation',
                    inputPlaceholder: 'e.g. Shipping area restricted...',
                    showCancelButton: true,
                    inputValidator: (value) => {
                        if (!value) return 'Please specify the reason!';
                    }
                });
                
                if (!textReason) return;
                finalReason = textReason;
            }
        } else {
            // Với các trạng thái khác (CONFIRMED, SHIPPING), chỉ cần xác nhận đơn giản
            const result = await Swal.fire({
                title: `Confirm ${status}?`,
                text: `Are you sure you want to change status to ${status}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669'
            });
            if (!result.isConfirmed) return;
        }

        // 3. Gửi dữ liệu lên Backend
        try {
            setLoading(true);
            await orderManagementService.changeStatus(orderId, status, finalReason);
            
            Swal.fire({
                title: 'Updated!',
                text: `Order status is now ${status}.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Tải lại dữ liệu sau 1.5s
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to update order status.', 'error');
        } finally {
            setLoading(false);
        }
    };

   const onShipFailed = async () => {
        // 1. Hiện hộp thoại chọn lý do có sẵn
        const { value: selectedReason, isConfirmed } = await Swal.fire({
            title: 'Shipment Failed',
            text: "Select a reason why this order couldn't be delivered:",
            input: 'select',
            inputOptions: {
                'Customer unreachable': 'Customer unreachable (Called 3 times)',
                'Refused by customer': 'Refused by customer',
                'Wrong delivery address': 'Wrong delivery address',
                'Other': 'Other (Enter manually)'
            },
            inputPlaceholder: 'Select a reason',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            confirmButtonText: 'Next',
            inputValidator: (value) => {
                if (!value) return 'You need to select a reason!';
            }
        });

        // Nếu người dùng nhấn Cancel hoặc thoát thì dừng lại
        if (!isConfirmed || !selectedReason) return;

        let finalReason = selectedReason;

        // 2. Nếu chọn "Other", hiện tiếp hộp thoại nhập văn bản
        if (selectedReason === 'Other') {
            const { value: manualReason, isConfirmed: isManualConfirmed } = await Swal.fire({
                title: 'Manual Reason',
                input: 'text',
                inputLabel: 'Please specify the exact failure reason',
                inputPlaceholder: 'e.g. Vehicle broken, weather issues...',
                showCancelButton: true,
                confirmButtonColor: '#e11d48',
                inputValidator: (value) => {
                    if (!value) return 'Please provide details for the failure!';
                }
            });

            if (!isManualConfirmed || !manualReason) return;
            finalReason = manualReason;
        }

        // 3. Gửi dữ liệu xuống Backend để hoàn kho và đổi trạng thái
        try {
            setLoading(true);
            // Gọi API của bạn để chuyển trạng thái sang CANCELLED
            await orderManagementService.changeStatus(orderId, 'CANCELLED', `Ship Failed: ${finalReason}`);
            
            await Swal.fire({
                title: 'Order Cancelled',
                text: 'Items returned to stock. Reason: ' + finalReason,
                icon: 'success',
                timer: 2000
            });
            
            window.location.reload(); // Tải lại để thấy Stock và Status mới
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to update order status.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSimulateWithFile = async (file) => {
    if (!file) return;

    Swal.fire({
        title: 'AI Verification...',
        text: 'Checking your package photo, please wait...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                // Gọi API Webhook
                await axios.post('http://localhost:8080/api/public/webhook/ghn', {
                    orderId: orderId,
                    image: reader.result
                });

                // THÀNH CÔNG: Chúc mừng và reload
                Swal.fire({
                    title: 'Verified!',
                    text: 'Package detected. Order status updated to DELIVERED.',
                    icon: 'success'
                });
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                // THẤT BẠI (AI Reject hoặc Lỗi): Hiện cảnh báo đỏ, KHÔNG reload
                const errorMsg = error.response?.data || "Could not detect a package.";
                
                Swal.fire({
                    title: 'Invalid Image!',
                    text: `AI says: ${errorMsg}. Please take a clearer photo of the shipping box.`,
                    icon: 'error',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#3b82f6'
                });
                // Shipper có thể nhấn "Try Again" để chọn lại file ngay lập tức
            }
        };
    } catch (error) {
        Swal.fire('Error', 'File reading failed.', 'error');
    }
};

    const onRefundPaypal = async () => {
        const result = await Swal.fire({
            title: 'Confirm Refund?',
            text: "This will return money to customer's PayPal account and cancel the order.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, refund it!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                // Gọi service Ngọc vừa thêm ở bước 1
                await orderManagementService.refundPayPalOrder(orderId);
                
                Swal.fire('Refunded!', 'Money has been sent back and stock restored.', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Refund failed', 'error');
            } finally {
                setLoading(false);
            }
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
                            {/* 1. Chỉ hiện Confirm Order khi đang ở trạng thái PENDING */}
                            {data.order?.orderStatus === 'PENDING' && (
                                <button 
                                    onClick={() => onAction('CONFIRMED')} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md"
                                >
                                    Confirm Order
                                </button>
                            )}

                            {/* 2. Chỉ hiện Start Shipping khi đang ở trạng thái CONFIRMED */}
                            {data.order?.orderStatus === 'CONFIRMED' && (
                                <button 
                                    onClick={() => onAction('SHIPPING')} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md"
                                >
                                    Start Shipping
                                </button>
                            )}

                            {/* 3. Nút Cancel có thể hiện ở cả PENDING hoặc CONFIRMED, nhưng ẩn khi đã SHIPPING */}
                            {(data.order?.orderStatus === 'PENDING' || data.order?.orderStatus === 'CONFIRMED') && (
                                <button 
                                    onClick={() => onAction('CANCELLED')} 
                                    className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-5 py-2 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            
                            {/* Thông báo nếu đơn hàng đã hoàn tất hoặc bị hủy */}
                            {['DELIVERED', 'CANCELLED'].includes(data.order?.orderStatus) && (
                                <span className="text-sm text-slate-400 italic">No further actions available for this status.</span>
                            )}
                        </div>
                    </div>
                    {/* Chỉ hiện nút Simulate AI nếu đơn hàng đang SHIPPING */}
                    {data.order?.orderStatus === 'SHIPPING' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                AI Verification Simulation
                            </label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="file" 
                                    id="ai-upload"
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleSimulateWithFile(e.target.files[0])}
                                />
                                <button 
                                    onClick={() => document.getElementById('ai-upload').click()}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                                >
                                    <span className="animate-pulse">●</span> Upload Package Photo & Simulate
                                </button>

                                <div className="flex gap-3 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <button 
                                        onClick={onShipFailed}
                                        className="bg-rose-100 hover:bg-rose-200 text-rose-600 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                                    >
                                        ⚠ Mark as Ship Failed
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Select an image to trigger Cloudinary AI object detection.</p>
                        </div>
                    )}
                    {/* Nút hoàn tiền chỉ hiện nếu là PayPal và đã được thanh toán */}
                                    {data.order?.orderStatus === 'CANCELLED' &&data.order?.paymentMethod === 'PAYPAL' && data.order?.paymentStatus === 'PAID' && (
                                        <button
                                            onClick={onRefundPaypal}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                                        >
                                            💸 Refund via PayPal
                                        </button>
                                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cột trái: Thông tin chính */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Thông tin khách hàng */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-400 uppercase mb-4">Customer Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400">Full Name</p>
                                        <p className="font-bold text-slate-800">
                                            {/* Sửa lại chính xác tên trường từ Backend */}
                                            {data.order?.shippingName || data.order?.user?.fullName || 'No Name Provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Phone Number</p>
                                        <p className="font-bold text-slate-800">
                                            {data.order?.shippingPhone || data.order?.user?.phone || 'No Phone Provided'}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-slate-400">Shipping Address</p>
                                        <p className="font-bold text-slate-800">
                                            {data.order?.shippingAddress || 'No Address Provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bảng danh sách sản phẩm */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-50">
                                    <h3 className="text-sm font-black text-slate-400 uppercase">Order Items</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Product</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Qty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Unit Price</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.items?.map((item) => (
                                            <tr key={item.id} className="text-sm">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Hiển thị ảnh nếu có, không thì dùng icon mặc định */}
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                            {item.product?.mainImage ? (
                                                                <img src={item.product.mainImage} alt="" className="w-full h-full object-cover rounded-lg" />
                                                            ) : <ClipboardList size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{item.product?.variantName || 'Unknown Product'}</p>
                                                            <p className="text-[10px] text-slate-400">SKU: #PROD-{item.product?.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-slate-600">x{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">${item.priceAtPurchase?.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        

                            {/* Timeline lịch sử xử lý */}
                            <OrderTimeline history={data.history} />
                        </div>

                        {/* Cột phải: Thanh toán & Xác minh */}
                        <div className="space-y-8">
                            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200 space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Subtotal</span>
                                        <span className="font-bold">${data.order?.totalBasePrice?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Shipping Fee</span>
                                        <span className="font-bold text-blue-400">+${data.order?.shippingFee?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Tax (10%)</span>
                                        <span className="font-bold">+${data.order?.taxAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-rose-400 border-b border-white/10 pb-3">
                                        <span>Discount</span>
                                        <span className="font-bold">-${data.order?.discountAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Total Pay</span>
                                        <span className="text-3xl font-black text-orange-500">${data.order?.totalPayPrice?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Nhật ký cuộc gọi */}
                            {/* <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
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
                            </div> */}

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

                            {/* AI Delivery Evidence Section */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    AI Delivery Evidence
                                </h3>
                                
                                {data.evidences && data.evidences.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <img 
                                                src={data.evidences[0].imageUrl} 
                                                alt="Delivery Evidence" 
                                                className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-inner"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                <button 
                                                    onClick={() => window.open(data.evidences[0].imageUrl, '_blank')}
                                                    className="text-white text-xs font-bold underline"
                                                >
                                                    View Full Image
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">AI Detection Results</p>
                                            <p className="text-xs text-slate-700 italic leading-relaxed">
                                                "{data.evidences[0].aiLabels || 'No labels detected'}"
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${data.evidences[0].isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {data.evidences[0].isValid ? '✓ AI VERIFIED' : '⚠ AI REJECTED'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-xs text-slate-400 italic">Waiting for delivery photo...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderDetailPage;