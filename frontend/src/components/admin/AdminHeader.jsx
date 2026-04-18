import React from 'react';
import { Bell, Languages, Plus, Search } from 'lucide-react';

export default function AdminHeader() {
    return (
        <header className='h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10'>
            {/* <div className='flex items-center gap-4 flex-1'>
                <div className='relative w-full max-w-md'>
                    <Search
                        size={16}
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                    />
                    <input
                        type='text'
                        placeholder='Search analytics, orders, products...'
                        className='w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500'
                    />
                </div>
            </div>

            <div className='flex items-center gap-4'>
                <button className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative transition-colors'>
                    <Bell size={20} />
                    <span className='absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white' />
                </button>

                <button className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors'>
                    <Languages size={20} />
                </button>

                <div className='h-8 w-px bg-slate-200 mx-2' />

                <button className='flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sky-600 transition-all shadow-sm'>
                    <Plus size={16} />
                    New Product
                </button>
            </div> */}
        </header>
    );
}
