import React, { useEffect, useState } from 'react';
import { getMyOrders, getMyProfile } from '@/services/profileApi';

export default function QuickStats() {
    const [totalOrders, setTotalOrders] = useState(0);
    const [memberSince, setMemberSince] = useState('---');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [orders, profile] = await Promise.all([getMyOrders(), getMyProfile()]);

                // Backend trả về Page<Order>, nên lấy totalElements
                setTotalOrders(
                    typeof orders?.totalElements === 'number' ? orders.totalElements : 0
                );

                // Member since
                if (profile?.createdAt) {
                    const date = new Date(profile.createdAt);
                    const formatted = date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                    });
                    setMemberSince(formatted);
                } else {
                    setMemberSince('---');
                }
            } catch (error) {
                console.error('Failed to load quick stats:', error);
                setTotalOrders(0);
                setMemberSince('---');
            }
        };

        fetchStats();
    }, []);

    return (
        <div className='col-span-12 grid grid-rows-2 gap-8 lg:col-span-4'>
            {/* TOTAL ORDERS */}
            <div className='flex items-center justify-between rounded-xl bg-surface-container-lowest p-6'>
                <div>
                    <p className='mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                        Total Orders
                    </p>
                    <p className='font-headline text-3xl font-extrabold text-primary'>
                        {totalOrders}
                    </p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 text-primary'>
                    <span
                        className='material-symbols-outlined'
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        shopping_bag
                    </span>
                </div>
            </div>

            {/* MEMBER SINCE */}
            <div className='flex items-center justify-between rounded-xl bg-surface-container-lowest p-6'>
                <div>
                    <p className='mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant'>
                        Member Since
                    </p>
                    <p className='font-headline text-2xl font-extrabold text-on-surface'>
                        {memberSince}
                    </p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-tertiary/5 text-tertiary'>
                    <span
                        className='material-symbols-outlined'
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        calendar_today
                    </span>
                </div>
            </div>
        </div>
    );
}
