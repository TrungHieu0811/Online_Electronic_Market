import React from 'react';
import { Laptop, User, ReceiptText, Wallet } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import StatCard from './StatCard';
import RevenueChartCard from './RevenueChartCard';
import TrendingCategoriesCard from './TrendingCategoriesCard';
import RecentOrdersTable from './RecentOrdersTable';

export default function AdminDashboardPage() {
    return (
        <div className='flex min-h-screen bg-slate-50'>
            <AdminSidebar />

            <main className='flex-1 flex flex-col min-w-0'>
                <AdminHeader />

                <div className='p-8 space-y-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        <StatCard
                            icon={<Laptop size={22} />}
                            iconBg='bg-blue-100'
                            iconColor='text-blue-600'
                            title='Total Products'
                            value='12,845'
                            change='+14%'
                            changeType='up'
                        />

                        <StatCard
                            icon={<User size={22} />}
                            iconBg='bg-purple-100'
                            iconColor='text-purple-600'
                            title='Total Users'
                            value='82,103'
                            change='+8.2%'
                            changeType='up'
                        />

                        <StatCard
                            icon={<ReceiptText size={22} />}
                            iconBg='bg-orange-100'
                            iconColor='text-orange-600'
                            title='Total Orders'
                            value='3,542'
                            change='-2.4%'
                            changeType='down'
                        />

                        <StatCard
                            icon={<Wallet size={22} />}
                            iconBg='bg-emerald-100'
                            iconColor='text-emerald-600'
                            title='Total Revenue'
                            value='$128,430'
                            change='+12.4%'
                            changeType='up'
                        />
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        <RevenueChartCard />
                        <TrendingCategoriesCard />
                    </div>

                    <RecentOrdersTable />
                </div>
            </main>
        </div>
    );
}
