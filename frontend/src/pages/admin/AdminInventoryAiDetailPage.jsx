import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getInventoryDashboard } from '@/services/inventoryAiApi';

function StatCard({ title, value, subValue, color = 'sky' }) {
    const colorMap = {
        sky: 'border-sky-500',
        green: 'border-green-500',
        amber: 'border-amber-500',
        red: 'border-red-500'
    };

    return (
        <div
            className={`rounded-2xl bg-white p-6 shadow-sm border-l-4 ${colorMap[color] || colorMap.sky}`}
        >
            <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>{title}</p>
            <p className='mt-2 text-3xl font-extrabold text-slate-900'>{value}</p>
            {subValue && <p className='mt-2 text-sm text-slate-500'>{subValue}</p>}
        </div>
    );
}

function SentimentBadge({ value }) {
    const map = {
        POSITIVE: 'bg-green-100 text-green-700',
        NEUTRAL: 'bg-yellow-100 text-yellow-700',
        NEGATIVE: 'bg-red-100 text-red-700',
        NO_DATA: 'bg-slate-100 text-slate-700'
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${map[value] || 'bg-slate-100 text-slate-700'}`}
        >
            {value || 'N/A'}
        </span>
    );
}

export default function AdminInventoryAiDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const dashboardData = await getInventoryDashboard(productId);
                setData(dashboardData);
            } catch (error) {
                console.error('Failed to load inventory dashboard:', error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchDashboard();
        }
    }, [productId]);

    const forecast = data?.forecast;
    const reorder = data?.reorderSuggestion;
    const sentiment = data?.sentimentSummary;
    const reviewSummary = data?.reviewSummary;

    return (
        <div className='min-h-screen bg-slate-50 flex'>
            <AdminSidebar />

            <main className='flex-1 p-8'>
                <div className='mx-auto max-w-7xl'>
                    <div className='mb-8 flex items-start justify-between gap-4'>
                        <div>
                            <h1 className='text-4xl font-extrabold text-slate-900'>
                                AI Product Insight
                            </h1>
                            <p className='mt-2 text-slate-500'>
                                {forecast?.productName || `Product #${productId}`}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/admin/inventory-ai')}
                            className='rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100'
                        >
                            Back to AI Inventory
                        </button>
                    </div>

                    {loading ? (
                        <div className='rounded-2xl bg-white p-10 text-center shadow-sm'>
                            Loading AI dashboard...
                        </div>
                    ) : !data ? (
                        <div className='rounded-2xl bg-white p-10 text-center shadow-sm text-red-500'>
                            Failed to load AI dashboard.
                        </div>
                    ) : (
                        <div className='space-y-8'>
                            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                                <StatCard
                                    title='Current Stock'
                                    value={forecast?.currentStock ?? 0}
                                    subValue={`Stock status: ${forecast?.stockStatus || 'N/A'}`}
                                    color='sky'
                                />
                                <StatCard
                                    title='Predicted Demand 7d'
                                    value={forecast?.predictedDemand7Days ?? 0}
                                    subValue={`Avg daily sales 7d: ${forecast?.avgDailySales7Days ?? 0}`}
                                    color='amber'
                                />
                                <StatCard
                                    title='Predicted Demand 30d'
                                    value={forecast?.predictedDemand30Days ?? 0}
                                    subValue={`Avg daily sales 30d: ${forecast?.avgDailySales30Days ?? 0}`}
                                    color='green'
                                />
                                <StatCard
                                    title='Days Until Out of Stock'
                                    value={forecast?.daysUntilOutOfStock ?? 0}
                                    subValue='Estimated by AI forecast'
                                    color='red'
                                />
                            </div>

                            <div className='grid grid-cols-1 gap-8 xl:grid-cols-2'>
                                <section className='rounded-2xl bg-white p-6 shadow-sm'>
                                    <h2 className='mb-4 text-xl font-bold text-slate-900'>
                                        Reorder Recommendation
                                    </h2>

                                    {reorder ? (
                                        <div className='space-y-3 text-sm'>
                                            <div className='flex justify-between border-b pb-3'>
                                                <span className='text-slate-500'>
                                                    Recommended stock
                                                </span>
                                                <span className='font-bold text-slate-900'>
                                                    {reorder.recommendedStock}
                                                </span>
                                            </div>
                                            <div className='flex justify-between border-b pb-3'>
                                                <span className='text-slate-500'>
                                                    Reorder quantity
                                                </span>
                                                <span className='font-bold text-slate-900'>
                                                    {reorder.reorderQuantity}
                                                </span>
                                            </div>
                                            <div className='flex justify-between'>
                                                <span className='text-slate-500'>Priority</span>
                                                <span className='font-bold text-slate-900'>
                                                    {reorder.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className='text-slate-500'>
                                            This product does not currently need reorder.
                                        </p>
                                    )}
                                </section>

                                <section className='rounded-2xl bg-white p-6 shadow-sm'>
                                    <h2 className='mb-4 text-xl font-bold text-slate-900'>
                                        Review Sentiment
                                    </h2>

                                    <div className='mb-4'>
                                        <SentimentBadge value={sentiment?.overallSentiment} />
                                    </div>

                                    <div className='space-y-3 text-sm'>
                                        <div className='flex justify-between border-b pb-3'>
                                            <span className='text-slate-500'>Positive reviews</span>
                                            <span className='font-bold text-green-700'>
                                                {sentiment?.positiveCount ?? 0}
                                            </span>
                                        </div>
                                        <div className='flex justify-between border-b pb-3'>
                                            <span className='text-slate-500'>Neutral reviews</span>
                                            <span className='font-bold text-yellow-700'>
                                                {sentiment?.neutralCount ?? 0}
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-slate-500'>Negative reviews</span>
                                            <span className='font-bold text-red-700'>
                                                {sentiment?.negativeCount ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <section className='rounded-2xl bg-white p-6 shadow-sm'>
                                <h2 className='mb-4 text-xl font-bold text-slate-900'>
                                    AI Review Summary
                                </h2>

                                {reviewSummary?.bulletPoints?.length ? (
                                    <ul className='space-y-3'>
                                        {reviewSummary.bulletPoints.map((point, index) => (
                                            <li
                                                key={index}
                                                className='rounded-xl bg-slate-50 px-4 py-3 text-slate-700'
                                            >
                                                • {point}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className='text-slate-500'>
                                        No AI review summary available.
                                    </p>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
