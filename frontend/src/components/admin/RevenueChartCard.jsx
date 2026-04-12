import React from 'react';

export default function RevenueChartCard({ range, total, data = [], loading }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const getRangeLabel = (value) => {
        switch (value) {
            case '6months':
                return 'Last 6 Months';
            case 'ytd':
                return 'Year to Date';
            case '30days':
            default:
                return 'Last 30 Days';
        }
    };

    const chartData = data.length > 0 ? data : [];
    const maxValue = Math.max(...chartData.map((item) => item.value || 0), 1);

    return (
        <div className='lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-start gap-4 mb-6'>
                <div>
                    <h2 className='text-lg font-bold text-slate-900'>Sales Revenue Overview</h2>
                    <p className='text-sm text-slate-500'>{getRangeLabel(range)}</p>
                    <p className='mt-2 text-2xl font-bold text-slate-900'>
                        {loading ? '...' : formatCurrency(total)}
                    </p>
                </div>

                <div className='bg-slate-100 rounded-lg text-xs font-bold px-3 py-2 text-slate-600'>
                    {getRangeLabel(range)}
                </div>
            </div>

            <div className='h-64 flex flex-col gap-4'>
                {loading ? (
                    <div className='flex-1 flex items-end gap-2 px-2'>
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className='flex-1 rounded-t-lg bg-slate-200 animate-pulse'
                                style={{ height: `${35 + index * 8}%` }}
                            />
                        ))}
                    </div>
                ) : chartData.length === 0 ? (
                    <div className='flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400'>
                        No revenue data available
                    </div>
                ) : (
                    <>
                        <div className='flex-1 flex items-end gap-3 px-2'>
                            {chartData.map((item, index) => {
                                const heightPercent = Math.max(
                                    12,
                                    Math.round(((item.value || 0) / maxValue) * 100)
                                );

                                const isActive = index === chartData.length - 1;

                                return (
                                    <div
                                        key={`${item.label}-${index}`}
                                        className='flex flex-1 flex-col items-center justify-end gap-2'
                                    >
                                        <span className='text-[10px] font-semibold text-slate-500'>
                                            {formatCurrency(item.value)}
                                        </span>

                                        <div
                                            className={`w-full rounded-t-lg transition-all ${
                                                isActive
                                                    ? 'bg-sky-500'
                                                    : 'bg-sky-200 hover:bg-sky-400'
                                            }`}
                                            style={{
                                                height: `${heightPercent}%`,
                                                minHeight: '28px'
                                            }}
                                            title={`${item.label}: ${formatCurrency(item.value)}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className='flex justify-between gap-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            {chartData.map((item, index) => (
                                <span
                                    key={`${item.label}-${index}`}
                                    className='flex-1 text-center truncate'
                                    title={item.label}
                                >
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
