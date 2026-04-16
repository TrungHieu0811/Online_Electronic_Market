import { ShoppingBag, DollarSign, Truck } from 'lucide-react';

const OrderStats = ({ stats }) => {
    const statCards = [
        { 
            label: 'Total Orders', 
            value: stats?.totalOrders || 0, 
            icon: <ShoppingBag size={22} />, 
            color: 'bg-blue-50 text-blue-600' 
        },
        { 
            label: 'Total Revenue', 
            value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`, 
            icon: <DollarSign size={22} />, 
            color: 'bg-emerald-50 text-emerald-600' 
        },
        { 
            label: 'Shipping Now', 
            value: stats?.shippingOrders || 0, 
            icon: <Truck size={22} />, 
            color: 'bg-orange-50 text-orange-600' 
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                        {item.icon}
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{item.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrderStats;