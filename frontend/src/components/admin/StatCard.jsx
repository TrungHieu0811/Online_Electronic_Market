import React from 'react';

export default function StatCard({
    icon,
    iconBg,
    iconColor,
    title,
    value,
    change,
    changeType = 'up'
}) {
    return (
        <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
                <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>{icon}</div>

                <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        changeType === 'up'
                            ? 'text-emerald-500 bg-emerald-50'
                            : 'text-rose-500 bg-rose-50'
                    }`}
                >
                    {change}
                </span>
            </div>

            <p className='text-slate-500 text-sm font-medium'>{title}</p>
            <h3 className='text-2xl font-bold text-slate-900 mt-1'>{value}</h3>
        </div>
    );
}
