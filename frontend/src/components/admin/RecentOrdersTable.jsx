import React from 'react';
import {Eye} from 'lucide-react';

export default function RecentOrdersTable({ data = [], loading }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-emerald-100 text-emerald-700';
            case 'SHIPPING':
                return 'bg-orange-100 text-orange-700';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-700';
            case 'PENDING':
                return 'bg-slate-100 text-slate-600';
            case 'CANCELLED':
                return 'bg-rose-100 text-rose-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const words = name.trim().split(' ');
        return words.length === 1 ? words[0][0] : words[0][0] + words[words.length - 1][0];
    };

    return (
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
            <div className='p-6 border-b border-slate-200 flex justify-between items-center'>
                <h2 className='text-lg font-bold text-slate-900'>Recent Orders</h2>
                <span className='text-sm font-medium text-slate-400'>Last 5 delivered orders</span>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='bg-slate-50'>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase'>
                                Order ID
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase'>
                                Customer
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase'>
                                Amount
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase'>
                                Status
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase'>
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            [...Array(5)].map((_, index) => (
                                <tr key={index}>
                                    <td className='px-6 py-4'>
                                        <div className='h-4 w-20 bg-slate-200 rounded animate-pulse' />
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='h-4 w-32 bg-slate-200 rounded animate-pulse' />
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='h-4 w-24 bg-slate-200 rounded animate-pulse' />
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='h-4 w-20 bg-slate-200 rounded animate-pulse' />
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='h-4 w-6 bg-slate-200 rounded animate-pulse' />
                                    </td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan='5'
                                    className='text-center py-10 text-slate-400 text-sm'
                                >
                                    No recent orders
                                </td>
                            </tr>
                        ) : (
                            data.map((order) => (
                                <tr key={order.id}>
                                    <td className='px-6 py-4 text-sm font-bold text-sky-500'>
                                        #{order.id}
                                    </td>

                                    <td className='px-6 py-4'>
                                        <div className='flex items-center gap-2'>
                                            <div className='w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold'>
                                                {getInitials(order.customerName)}
                                            </div>
                                            <span className='text-sm font-medium'>
                                                {order.customerName}
                                            </span>
                                        </div>
                                    </td>

                                    <td className='px-6 py-4 text-sm font-bold'>
                                        {formatCurrency(order.totalPayPrice)}
                                    </td>

                                    <td className='px-6 py-4'>
                                        <span
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getStatusStyle(
                                                order.orderStatus
                                            )}`}
                                        >
                                            {order.orderStatus}
                                        </span>
                                    </td>

                                    <td className='px-6 py-4'>
                                        <button className='text-slate-400 hover:text-sky-500 transition-colors'>
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
