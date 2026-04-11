import React from 'react';

const categories = [
    { name: 'Smartphones', percent: 42, color: 'bg-sky-500' },
    { name: 'Laptops', percent: 35, color: 'bg-purple-500' },
    { name: 'Smartwatches', percent: 18, color: 'bg-orange-500' },
    { name: 'Accessories', percent: 5, color: 'bg-emerald-500' }
];

export default function TrendingCategoriesCard() {
    return (
        <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <h2 className='text-lg font-bold text-slate-900 mb-6'>Trending Categories</h2>

            <div className='space-y-6'>
                {categories.map((item) => (
                    <div key={item.name} className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                            <span className='text-slate-600 font-medium'>{item.name}</span>
                            <span className='font-bold'>{item.percent}%</span>
                        </div>

                        <div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden'>
                            <div
                                className={`h-full rounded-full ${item.color}`}
                                style={{ width: `${item.percent}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button className='w-full mt-8 py-3 text-sm font-bold text-sky-500 border border-sky-200 rounded-xl hover:bg-sky-500 hover:text-white transition-all'>
                View Detailed Report
            </button>
        </div>
    );
}
