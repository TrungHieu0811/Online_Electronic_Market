import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyOrders } from '@/services/profileApi';

export default function RecentOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getMyOrders();

                // Backend trả về Page<Order>, nên lấy data.content
                const orderList = Array.isArray(data?.content) ? data.content : [];

                const sortedOrders = [...orderList].sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || 0);
                    const dateB = new Date(b.createdAt || b.created_at || 0);
                    return dateB - dateA;
                });

                setOrders(sortedOrders.slice(0, 3));
            } catch (error) {
                console.error('Failed to load recent orders:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const formatDate = (dateValue) => {
        if (!dateValue) return 'No date';

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return 'No date';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const formatPrice = (value) => {
        if (value == null) return '$0.00';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-surface-container-highest text-on-surface-variant';
            case 'SHIPPING':
                return 'bg-secondary-container text-on-secondary-container';
            case 'CONFIRMED':
                return 'bg-primary/10 text-primary';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-600';
            case 'RETURNED':
                return 'bg-orange-100 text-orange-600';
            default:
                return 'bg-surface-container-highest text-on-surface-variant';
        }
    };

    const handleOpenOrder = (orderId) => {
        navigate(`/profile/orders/${orderId}/review`, {
            state: {
                backgroundLocation: location
            }
        });
    };

    return (
        <section className='col-span-12 rounded-xl bg-surface-container-lowest p-8 lg:col-span-7'>
            <div className='mb-8 flex items-center justify-between'>
                <h3 className='font-headline text-xl font-bold text-on-surface'>Recent Orders</h3>
                <a
                    href='/profile/orders'
                    className='text-sm font-semibold text-primary hover:underline'
                >
                    View All
                </a>
            </div>

            {loading ? (
                <p className='text-sm text-on-surface-variant'>Loading recent orders...</p>
            ) : orders.length === 0 ? (
                <p className='text-sm text-on-surface-variant'>No orders found.</p>
            ) : (
                <div className='space-y-8'>
                    {orders.map((order) => {
                        const createdAt = order.createdAt || order.created_at;
                        const totalPrice =
                            order.totalPayPrice ?? order.total_price ?? order.totalBasePrice ?? 0;

                        return (
                            <button
                                key={order.id}
                                type='button'
                                onClick={() => handleOpenOrder(order.id)}
                                className='group flex w-full items-center justify-between rounded-xl p-3 text-left transition hover:bg-surface-container-low'
                            >
                                <div className='flex items-center gap-5'>
                                    <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-container-low'>
                                        <span
                                            className='material-symbols-outlined text-3xl text-on-surface-variant'
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            shopping_bag
                                        </span>
                                    </div>

                                    <div>
                                        <p className='font-bold text-on-surface'>
                                            Order #{order.id}
                                        </p>
                                        <p className='text-sm text-on-surface-variant'>
                                            Placed on {formatDate(createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className='text-right'>
                                    <p className='font-headline font-bold text-on-surface'>
                                        {formatPrice(totalPrice)}
                                    </p>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusClass(order.orderStatus)}`}
                                    >
                                        {order.orderStatus || 'UNKNOWN'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
