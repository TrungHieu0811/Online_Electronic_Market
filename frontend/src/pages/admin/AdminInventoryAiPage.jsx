import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    getReorderSuggestions,
    getStockAlerts,
    getSlowMovingProducts
} from '@/services/inventoryAiApi';

function PriorityBadge({ value }) {
    const map = {
        HIGH: 'bg-red-100 text-red-700',
        MEDIUM: 'bg-yellow-100 text-yellow-700',
        LOW: 'bg-green-100 text-green-700'
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${map[value] || 'bg-slate-100 text-slate-700'}`}
        >
            {value || 'N/A'}
        </span>
    );
}

function AlertBadge({ value }) {
    const map = {
        CRITICAL: 'bg-red-100 text-red-700',
        WARNING: 'bg-yellow-100 text-yellow-700',
        NORMAL: 'bg-green-100 text-green-700'
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${map[value] || 'bg-slate-100 text-slate-700'}`}
        >
            {value || 'N/A'}
        </span>
    );
}

function TabButton({ active, onClick, children, count }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {children} ({count})
        </button>
    );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className='mt-6 flex items-center justify-between gap-4'>
            <p className='text-sm text-slate-500'>
                Page {currentPage} / {totalPages}
            </p>

            <div className='flex items-center gap-2'>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50'
                >
                    Previous
                </button>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50'
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default function AdminInventoryAiPage() {
    const navigate = useNavigate();

    const [reorderSuggestions, setReorderSuggestions] = useState([]);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [slowMovingProducts, setSlowMovingProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('reorder');

    const ITEMS_PER_PAGE = 5;

    const [reorderPage, setReorderPage] = useState(1);
    const [alertsPage, setAlertsPage] = useState(1);
    const [slowPage, setSlowPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [reorderData, alertsData, slowData] = await Promise.all([
                    getReorderSuggestions(),
                    getStockAlerts(),
                    getSlowMovingProducts()
                ]);

                setReorderSuggestions(Array.isArray(reorderData) ? reorderData : []);
                setStockAlerts(Array.isArray(alertsData) ? alertsData : []);
                setSlowMovingProducts(Array.isArray(slowData) ? slowData : []);
            } catch (error) {
                console.error('Failed to load AI inventory data:', error);
                setReorderSuggestions([]);
                setStockAlerts([]);
                setSlowMovingProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const paginateData = (data, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    const reorderTotalPages = Math.ceil(reorderSuggestions.length / ITEMS_PER_PAGE) || 1;
    const alertsTotalPages = Math.ceil(stockAlerts.length / ITEMS_PER_PAGE) || 1;
    const slowTotalPages = Math.ceil(slowMovingProducts.length / ITEMS_PER_PAGE) || 1;

    const paginatedReorder = useMemo(
        () => paginateData(reorderSuggestions, reorderPage),
        [reorderSuggestions, reorderPage]
    );

    const paginatedAlerts = useMemo(
        () => paginateData(stockAlerts, alertsPage),
        [stockAlerts, alertsPage]
    );

    const paginatedSlow = useMemo(
        () => paginateData(slowMovingProducts, slowPage),
        [slowMovingProducts, slowPage]
    );

    const renderReorderTable = () => {
        if (reorderSuggestions.length === 0) {
            return <p className='text-slate-500'>No reorder suggestions.</p>;
        }

        return (
            <>
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead>
                            <tr className='border-b text-left text-slate-500'>
                                <th className='py-3 pr-4'>Product</th>
                                <th className='py-3 pr-4'>Stock</th>
                                <th className='py-3 pr-4'>Demand 30d</th>
                                <th className='py-3 pr-4'>Reorder Qty</th>
                                <th className='py-3 pr-4'>Priority</th>
                                <th className='py-3 pr-4'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReorder.map((item) => (
                                <tr key={item.productId} className='border-b last:border-0'>
                                    <td className='py-4 pr-4 font-semibold text-slate-900'>
                                        {item.productName}
                                    </td>
                                    <td className='py-4 pr-4'>{item.currentStock}</td>
                                    <td className='py-4 pr-4'>{item.predictedDemand30Days}</td>
                                    <td className='py-4 pr-4'>{item.reorderQuantity}</td>
                                    <td className='py-4 pr-4'>
                                        <PriorityBadge value={item.priority} />
                                    </td>
                                    <td className='py-4 pr-4'>
                                        <button
                                            onClick={() =>
                                                navigate(`/admin/inventory-ai/${item.productId}`)
                                            }
                                            className='rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700'
                                        >
                                            View AI
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={reorderPage}
                    totalPages={reorderTotalPages}
                    onPageChange={setReorderPage}
                />
            </>
        );
    };

    const renderAlertsTable = () => {
        if (stockAlerts.length === 0) {
            return <p className='text-slate-500'>No stock alerts.</p>;
        }

        return (
            <>
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead>
                            <tr className='border-b text-left text-slate-500'>
                                <th className='py-3 pr-4'>Product</th>
                                <th className='py-3 pr-4'>Stock</th>
                                <th className='py-3 pr-4'>Daily Demand</th>
                                <th className='py-3 pr-4'>Days Left</th>
                                <th className='py-3 pr-4'>Level</th>
                                <th className='py-3 pr-4'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAlerts.map((item) => (
                                <tr key={item.productId} className='border-b last:border-0'>
                                    <td className='py-4 pr-4 font-semibold text-slate-900'>
                                        {item.productName}
                                    </td>
                                    <td className='py-4 pr-4'>{item.currentStock}</td>
                                    <td className='py-4 pr-4'>{item.predictedDailySales}</td>
                                    <td className='py-4 pr-4'>{item.daysUntilOutOfStock}</td>
                                    <td className='py-4 pr-4'>
                                        <AlertBadge value={item.level} />
                                    </td>
                                    <td className='py-4 pr-4'>
                                        <button
                                            onClick={() =>
                                                navigate(`/admin/inventory-ai/${item.productId}`)
                                            }
                                            className='rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700'
                                        >
                                            View AI
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={alertsPage}
                    totalPages={alertsTotalPages}
                    onPageChange={setAlertsPage}
                />
            </>
        );
    };

    const renderSlowTable = () => {
        if (slowMovingProducts.length === 0) {
            return <p className='text-slate-500'>No slow-moving products.</p>;
        }

        return (
            <>
                <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <thead>
                            <tr className='border-b text-left text-slate-500'>
                                <th className='py-3 pr-4'>Product</th>
                                <th className='py-3 pr-4'>Stock</th>
                                <th className='py-3 pr-4'>Sold 30d</th>
                                <th className='py-3 pr-4'>Reason</th>
                                <th className='py-3 pr-4'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSlow.map((item) => (
                                <tr key={item.productId} className='border-b last:border-0'>
                                    <td className='py-4 pr-4 font-semibold text-slate-900'>
                                        {item.productName}
                                    </td>
                                    <td className='py-4 pr-4'>{item.currentStock}</td>
                                    <td className='py-4 pr-4'>{item.soldLast30Days}</td>
                                    <td className='py-4 pr-4 text-slate-600'>{item.reason}</td>
                                    <td className='py-4 pr-4'>
                                        <button
                                            onClick={() =>
                                                navigate(`/admin/inventory-ai/${item.productId}`)
                                            }
                                            className='rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700'
                                        >
                                            View AI
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={slowPage}
                    totalPages={slowTotalPages}
                    onPageChange={setSlowPage}
                />
            </>
        );
    };

    return (
        <div className='flex min-h-screen bg-slate-50'>
            <AdminSidebar />

            <main className='flex-1 p-8'>
                <div className='mx-auto max-w-7xl'>
                    <div className='mb-8'>
                        <h1 className='text-4xl font-extrabold text-slate-900'>
                            AI Inventory Center
                        </h1>
                        <p className='mt-2 text-slate-500'>
                            Monitor stock forecasts, reorder suggestions, and product performance
                            insights.
                        </p>
                    </div>

                    {loading ? (
                        <div className='rounded-2xl bg-white p-10 text-center shadow-sm'>
                            Loading AI inventory insights...
                        </div>
                    ) : (
                        <div className='rounded-2xl bg-white p-6 shadow-sm'>
                            <div className='mb-6 flex flex-wrap gap-3'>
                                <TabButton
                                    active={activeTab === 'reorder'}
                                    onClick={() => setActiveTab('reorder')}
                                    count={reorderSuggestions.length}
                                >
                                    Reorder Suggestions
                                </TabButton>

                                <TabButton
                                    active={activeTab === 'alerts'}
                                    onClick={() => setActiveTab('alerts')}
                                    count={stockAlerts.length}
                                >
                                    Stock Alerts
                                </TabButton>

                                <TabButton
                                    active={activeTab === 'slow'}
                                    onClick={() => setActiveTab('slow')}
                                    count={slowMovingProducts.length}
                                >
                                    Slow-moving Products
                                </TabButton>
                            </div>

                            {activeTab === 'reorder' && renderReorderTable()}
                            {activeTab === 'alerts' && renderAlertsTable()}
                            {activeTab === 'slow' && renderSlowTable()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
