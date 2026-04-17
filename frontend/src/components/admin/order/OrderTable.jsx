import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderTable = ({ orders, loading }) => {
    const navigate = useNavigate();

    const renderStatusBadge = (status) => {
    // Nếu status là null hoặc undefined, gán bằng PENDING để hiển thị
    const currentStatus = status || "PENDING"; 

    const colors = {
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        CONFIRMED: "bg-orange-100 text-orange-700 border-orange-200",
        CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
        SHIPPING: "bg-blue-100 text-blue-700 border-blue-200",
        DELIVERED: "bg-green-100 text-green-700 border-green-200"
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[currentStatus] || "bg-slate-100 text-slate-600"}`}>
            • {currentStatus}
        </span>
    );
};

    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Fetching orders...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Array.isArray(orders) && orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-orange-600">#EM-{order.id}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                                {order.shippingName || order.user?.fullName || order.user?.username || 'Guest'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black text-slate-900">${order.totalPayPrice?.toFixed(2)}</td>
                            <td className="px-6 py-4">{renderStatusBadge(order.orderStatus)}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-sm font-bold text-slate-900 hover:underline">
                                    View Details →
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderTable;