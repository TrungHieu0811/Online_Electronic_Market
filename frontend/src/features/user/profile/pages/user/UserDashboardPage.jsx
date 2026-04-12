import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/user/dashboard/TopNavbar';
import Sidebar from '@/components/user/dashboard/Sidebar';
import ProfileCard from '@/components/user/dashboard/ProfileCard';
import QuickStats from '@/components/user/dashboard/QuickStats';
import RecentOrders from '@/components/user/dashboard/RecentOrders';
import ShippingCard from '@/components/user/dashboard/ShippingCard';
import PaymentCard from '@/components/user/dashboard/PaymentCard';
import Footer from '@/components/user/dashboard/Footer';
import { getMyProfile } from '@/services/profileApi';

export default function UserDashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getMyProfile();
            setUser(data);
            setError('');
        } catch (err) {
            console.error('Lỗi lấy profile:', err);
            setError('Không lấy được thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <div className='bg-surface text-on-surface min-h-screen'>
            <TopNavbar />

            <div className='flex pt-20'>
                <Sidebar />

                <main className='ml-64 flex-1 bg-surface p-10'>
                    <header className='mb-12'>
                        <h1 className='font-headline mb-2 text-4xl font-extrabold tracking-tight text-on-surface'>
                            Account Overview
                        </h1>
                        <p className='text-lg text-on-surface-variant'>
                            Manage your precision gear and tracking preferences.
                        </p>
                    </header>

                    {loading && (
                        <div className='mb-6 rounded-xl bg-surface-container-lowest p-4 text-on-surface'>
                            Loading profile...
                        </div>
                    )}

                    {error && (
                        <div className='mb-6 rounded-xl bg-red-100 p-4 text-red-600'>{error}</div>
                    )}

                    <div className='grid grid-cols-12 gap-8'>
                        <ProfileCard user={user} onProfileUpdated={fetchProfile} />
                        <QuickStats />
                        <RecentOrders />

                        <div className='col-span-12 flex flex-col gap-8 lg:col-span-5'>
                            <ShippingCard />
                            <PaymentCard />
                        </div>
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
}
