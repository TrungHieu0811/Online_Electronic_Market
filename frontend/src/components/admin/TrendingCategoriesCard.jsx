import React from 'react';

export default function TrendingCategoriesCard({ range, total, data = [], loading }) {
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

    const progressColors = [
        'bg-sky-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-emerald-500',
        'bg-rose-500'
    ];

    const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
        <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='mb-6'>
                <h2 className='text-lg font-bold text-slate-900'>Trending Categories</h2>
                <p className='text-sm text-slate-500 mt-1'>By revenue · {getRangeLabel(range)}</p>
                <p className='mt-2 text-xl font-bold text-slate-900'>
                    {loading ? '...' : formatCurrency(total)}
                </p>
            </div>

            <div className='space-y-6'>
                {loading ? (
                    [...Array(4)].map((_, index) => (
                        <div key={index} className='space-y-2'>
                            <div className='flex justify-between text-sm'>
                                <div className='h-4 w-24 rounded bg-slate-200 animate-pulse' />
                                <div className='h-4 w-12 rounded bg-slate-200 animate-pulse' />
                            </div>
                            <div className='h-2 w-full rounded-full bg-slate-100 overflow-hidden'>
                                <div
                                    className='h-full rounded-full bg-slate-200 animate-pulse'
                                    style={{ width: `${30 + index * 15}%` }}
                                />
                            </div>
                        </div>
                    ))
                ) : data.length === 0 ? (
                    <div className='flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400'>
                        No category revenue data available
                    </div>
                ) : (
                    data.map((item, index) => {
                        const percent = totalValue > 0 ? ((item.value || 0) / totalValue) * 100 : 0;
                        const color = progressColors[index % progressColors.length];

                        return (
                            <div key={`${item.name}-${index}`} className='space-y-2'>
                                <div className='flex justify-between gap-3 text-sm'>
                                    <span className='text-slate-600 font-medium truncate'>
                                        {item.name}
                                    </span>

                                    <div className='text-right'>
                                        <p className='font-bold text-slate-900'>
                                            {formatCurrency(item.value)}
                                        </p>
                                        <p className='text-xs text-slate-400'>
                                            {percent.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden'>
                                    <div
                                        className={`h-full rounded-full ${color}`}
                                        style={{ width: `${Math.max(percent, 4)}%` }}
                                        title={`${item.name}: ${formatCurrency(item.value)}`}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className='w-full mt-8 py-3 text-center text-sm font-bold text-sky-500 border border-sky-200 rounded-xl bg-sky-50'>
                Total category revenue: {loading ? '...' : formatCurrency(totalValue)}
            </div>
        </div>
    );
}
