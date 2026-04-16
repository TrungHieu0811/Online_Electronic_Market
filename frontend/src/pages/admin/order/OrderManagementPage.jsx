import React, { useState, useEffect } from 'react';
import OrderTable from '../../../components/admin/order/OrderTable';
import { orderManagementService } from '../../../services/orderManagementService';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { Package, Search, PlayCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import OrderStats from '../../../components/admin/order/OrderStats';

const OrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentStatus, setCurrentStatus] = useState(''); // State cho Tab
    const [pagination, setPagination] = useState({ page: 0, size: 8, totalPages: 0 });
    const [stats, setStats] = useState(null);

    

    const tabs = [
        { label: 'All Orders', value: '' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Shipping', value: 'SHIPPING' },
        { label: 'Delivered', value: 'DELIVERED' },
        { label: 'Cancelled', value: 'CANCELLED' },
    ];

   
    const fetchOrders = async () => {
        setLoading(true);
        try {
            let response;
            const trimmedSearch = searchTerm.trim();

            if (trimmedSearch) {
                // Gọi API Search nếu có chữ trong ô nhập
                response = await orderManagementService.searchOrders(trimmedSearch, pagination.page, pagination.size);
            } else {
                // Gọi API GetAll nếu ô search trống
                response = await orderManagementService.getAllOrders(pagination.page, pagination.size, currentStatus);
            }

            // Xử lý dữ liệu từ Page object của Spring
            if (response.data) {
                setOrders(response.data.content || []);
                setPagination(prev => ({ 
                    ...prev, 
                    totalPages: response.data.totalPages || 0 
                }));
            }

            const statsResponse = await orderManagementService.getOrderStats();
            setStats(statsResponse.data);

        } catch (err) {
            console.error("Lỗi gọi API đơn hàng:", err);
            // Gợi ý cho Ngọc: Nếu lỗi 403, hiện thông báo mời login lại
            if (err.response?.status === 403) {
                Swal.fire('Session Expired', 'Please login again to continue.', 'warning');
            }
        } finally {
            setLoading(false);
        }
    };

   useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Khi người dùng gõ search, ta nên chủ động đưa về trang 0
            fetchOrders();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [currentStatus, pagination.page, searchTerm]);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 flex flex-col min-w-0">
                <AdminHeader />

                <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 italic uppercase">Order Management</h1>
                            <p className="text-slate-500 text-sm">Automated with Cloudinary AI Verification</p>
                        </div>
                        <div className="flex gap-2">
                            {/* <button 
                                onClick={handleDemoAI}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg"
                            >
                                <PlayCircle size={18} /> Simulate GHN
                            </button> */}
                            <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg">
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <OrderStats stats={stats} />

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Order ID or Name..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                     {/* Tabs Lọc Trạng Thái */}
                    <div className="flex border-b border-slate-200 gap-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => { setCurrentStatus(tab.value); setPagination(p => ({...p, page: 0})); }}
                                className={`pb-3 text-sm font-semibold transition-all relative ${
                                    currentStatus === tab.value ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.label}
                                {currentStatus === tab.value && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <OrderTable 
                        orders={orders} 
                        loading={loading} 
                        onRefresh={fetchOrders} // Truyền callback để table có thể gọi lại sau khi update status
                    />

                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-b-2xl border-t border-slate-50">
                            <p className="text-sm text-slate-500">
                                Page <span className="font-bold text-slate-800">{pagination.page + 1}</span> of {pagination.totalPages}
                            </p>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 0}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>

                                {/* Hiển thị danh sách số trang */}
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i)}
                                        className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${
                                            pagination.page === i 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages - 1}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    {!loading && orders.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
                                <Package size={40} />
                            </div>
                            <p className="text-slate-500 font-medium">No orders found in this category.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrderManagementPage;