import React, { useEffect, useState } from 'react';
import { Laptop, User, ReceiptText, Wallet } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
// import AdminHeader from './AdminHeader';
import StatCard from './StatCard';
import RevenueChartCard from './RevenueChartCard';
import TrendingCategoriesCard from './TrendingCategoriesCard';
import RecentOrdersTable from './RecentOrdersTable';
import { getDashboard } from '@/services/dashboardApi';

export default function AdminDashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [range, setRange] = useState('30days');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const data = await getDashboard(range);
                setDashboard(data);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [range]);

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value || 0);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    return (
        <div className='flex min-h-screen bg-slate-50'>
            <AdminSidebar />

            <main className='flex-1 flex flex-col min-w-0'>
                {/* <AdminHeader /> */}

                <div className='p-8 space-y-8'>
                    <div className='flex items-center justify-between gap-4'>
                        <div>
                            <h1 className='text-2xl font-bold text-slate-900'>Dashboard</h1>
                            <p className='text-sm text-slate-500 mt-1'>
                                Overview of products, users, orders and revenue
                            </p>
                        </div>

                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className='rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-slate-400'
                        >
                            <option value='30days'>Last 30 Days</option>
                            <option value='6months'>Last 6 Months</option>
                            <option value='ytd'>Year to Date</option>
                        </select>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        <StatCard
                            icon={<Laptop size={22} />}
                            iconBg='bg-blue-100'
                            iconColor='text-blue-600'
                            title='Total Products'
                            value={loading ? '...' : formatNumber(dashboard?.totalProducts)}
                            change='All time'
                            changeType='up'
                        />

                        <StatCard
                            icon={<User size={22} />}
                            iconBg='bg-purple-100'
                            iconColor='text-purple-600'
                            title='Total Users'
                            value={loading ? '...' : formatNumber(dashboard?.totalUsers)}
                            change='All time'
                            changeType='up'
                        />

                        <StatCard
                            icon={<ReceiptText size={22} />}
                            iconBg='bg-orange-100'
                            iconColor='text-orange-600'
                            title='Total Orders'
                            value={loading ? '...' : formatNumber(dashboard?.totalOrders)}
                            change='All time'
                            changeType='up'
                        />

                        <StatCard
                            icon={<Wallet size={22} />}
                            iconBg='bg-emerald-100'
                            iconColor='text-emerald-600'
                            title='Total Revenue'
                            value={loading ? '...' : formatCurrency(dashboard?.totalRevenue)}
                            change='Delivered orders'
                            changeType='up'
                        />
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        <RevenueChartCard
                            range={range}
                            total={dashboard?.filteredRevenue || 0}
                            data={dashboard?.revenueByMonth || []}
                            loading={loading}
                        />

                        <TrendingCategoriesCard
                            range={range}
                            total={dashboard?.filteredRevenue || 0}
                            data={dashboard?.topCategories || []}
                            loading={loading}
                        />
                    </div>

                    <RecentOrdersTable data={dashboard?.recentOrders || []} loading={loading} />
                </div>
            </main>
        </div>
    );
}
