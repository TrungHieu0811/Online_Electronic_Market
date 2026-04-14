import React, { useState, useEffect } from 'react';
import OrderTable from '../../../components/admin/order/OrderTable';
import { orderManagementService } from '../../../services/orderManagementService';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { Package, Search } from 'lucide-react';

const OrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        orderManagementService.getAllOrders()
            .then(res => setOrders(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Logic lọc đơn hàng theo ID hoặc Tên khách (nếu cần giống trang Brand)
    const filteredOrders = Array.isArray(orders) 
    ? orders.filter(order => 
        order.id?.toString().includes(searchTerm) || 
        order.user?.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* 1. Sidebar bên trái */}
            <AdminSidebar />

            {/* 2. Nội dung chính bên phải */}
            <main className="flex-1 flex flex-col min-w-0">
                <AdminHeader />

                <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
                    
                    {/* Page Header giống trang Brand */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 italic uppercase">Order Management</h1>
                            <p className="text-slate-500 text-sm">Review and manage customer transactions</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg w-fit">
                            Export CSV
                        </button>
                    </div>

                    {/* Thanh tìm kiếm giống trang Brand */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer name..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bảng danh sách đơn hàng */}
                    <OrderTable orders={filteredOrders} loading={loading} />

                    {/* Hiển thị khi không có dữ liệu */}
                    {!loading && filteredOrders.length === 0 && (
                        <div className="text-center py-20">
                            <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
                                <Package size={40} />
                            </div>
                            <p className="text-slate-500 font-medium">No orders found matching your search.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrderManagementPage;