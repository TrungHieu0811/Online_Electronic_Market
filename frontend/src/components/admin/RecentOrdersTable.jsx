import React from 'react';
import { Eye } from 'lucide-react';

const orders = [
    {
        id: '#EM-8921',
        initials: 'JD',
        customer: 'Jane Doe',
        product: 'iPhone 15 Pro Max',
        amount: '$1,299.00',
        status: 'Delivered',
        statusClass: 'bg-emerald-100 text-emerald-700'
    },
    {
        id: '#EM-8922',
        initials: 'MS',
        customer: 'Mark Smith',
        product: 'MacBook Air M3',
        amount: '$1,499.00',
        status: 'Processing',
        statusClass: 'bg-blue-100 text-blue-700'
    },
    {
        id: '#EM-8923',
        initials: 'RW',
        customer: 'Rachel White',
        product: 'Sony WH-1000XM5',
        amount: '$348.00',
        status: 'Shipped',
        statusClass: 'bg-orange-100 text-orange-700'
    },
    {
        id: '#EM-8924',
        initials: 'PL',
        customer: 'Peter Lee',
        product: 'Samsung S24 Ultra',
        amount: '$1,199.00',
        status: 'Cancelled',
        statusClass: 'bg-rose-100 text-rose-700'
    }
];

export default function RecentOrdersTable() {
    return (
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
            <div className='p-6 border-b border-slate-200 flex justify-between items-center'>
                <h2 className='text-lg font-bold text-slate-900'>Recent Orders</h2>
                <button className='text-sm font-bold text-sky-500 hover:underline'>View All</button>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='bg-slate-50'>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Order ID
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Customer
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Product
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Amount
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Status
                            </th>
                            <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className='divide-y divide-slate-100'>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className='px-6 py-4 text-sm font-bold text-sky-500'>
                                    {order.id}
                                </td>

                                <td className='px-6 py-4'>
                                    <div className='flex items-center gap-2'>
                                        <div className='w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold'>
                                            {order.initials}
                                        </div>
                                        <span className='text-sm font-medium'>
                                            {order.customer}
                                        </span>
                                    </div>
                                </td>

                                <td className='px-6 py-4 text-sm'>{order.product}</td>
                                <td className='px-6 py-4 text-sm font-bold'>{order.amount}</td>

                                <td className='px-6 py-4'>
                                    <span
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${order.statusClass}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>

                                <td className='px-6 py-4'>
                                    <button className='text-slate-400 hover:text-sky-500 transition-colors'>
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
