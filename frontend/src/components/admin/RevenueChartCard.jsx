import React from 'react';

const chartData = [
    { day: 'Mon', height: '40%' },
    { day: 'Tue', height: '65%' },
    { day: 'Wed', height: '45%' },
    { day: 'Thu', height: '80%' },
    { day: 'Fri', height: '95%', active: true },
    { day: 'Sat', height: '70%' },
    { day: 'Sun', height: '55%' }
];

export default function RevenueChartCard() {
    return (
        <div className='lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h2 className='text-lg font-bold text-slate-900'>Sales Revenue Overview</h2>
                    <p className='text-sm text-slate-500'>Monthly performance tracking</p>
                </div>

                <select className='bg-slate-100 rounded-lg text-xs font-bold px-3 py-2 outline-none'>
                    <option>Last 30 Days</option>
                    <option>Last 6 Months</option>
                    <option>Year to Date</option>
                </select>
            </div>

            <div className='h-64 flex flex-col gap-4'>
                <div className='flex-1 flex items-end gap-2 px-2'>
                    {chartData.map((item) => (
                        <div
                            key={item.day}
                            className={`flex-1 rounded-t-lg transition-all ${
                                item.active ? 'bg-sky-500' : 'bg-sky-200 hover:bg-sky-400'
                            }`}
                            style={{ height: item.height }}
                        />
                    ))}
                </div>

                <div className='flex justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                    {chartData.map((item) => (
                        <span key={item.day}>{item.day}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
