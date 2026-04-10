import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyOrders } from '@/services/profileApi';
import { getOrderForReview } from '@/services/orderReviewApi';
import TopNavbar from '@/components/user/dashboard/TopNavbar';
import Sidebar from '@/components/user/dashboard/Sidebar';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [reviewableMap, setReviewableMap] = useState({});

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await getMyOrders();

                if (Array.isArray(data)) {
                    const sortedOrders = [...data].sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.created_at || 0);
                        const dateB = new Date(b.createdAt || b.created_at || 0);
                        return dateB - dateA;
                    });
                    setOrders(sortedOrders);
                } else {
                    setOrders([]);
                }
            } catch (error) {
                console.error('Failed to load orders:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    useEffect(() => {
        const checkReviewableOrders = async () => {
            const deliveredOrders = orders.filter((order) => order.orderStatus === 'DELIVERED');

            if (deliveredOrders.length === 0) {
                setReviewableMap({});
                return;
            }

            try {
                const results = await Promise.all(
                    deliveredOrders.map(async (order) => {
                        try {
                            const data = await getOrderForReview(order.id);
                            const hasItemsToReview =
                                Array.isArray(data?.items) && data.items.length > 0;
                            return [order.id, hasItemsToReview];
                        } catch (error) {
                            console.error(
                                `Failed to check reviewable items for order ${order.id}:`,
                                error
                            );
                            return [order.id, false];
                        }
                    })
                );

                setReviewableMap(Object.fromEntries(results));
            } catch (error) {
                console.error('Failed to check reviewable orders:', error);
                setReviewableMap({});
            }
        };

        if (orders.length > 0) {
            checkReviewableOrders();
        }
    }, [orders]);

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
        const number = Number(value ?? 0);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(number);
    };

    const getOrderDate = (order) => order.createdAt || order.created_at || null;

    const getOrderTotal = (order) =>
        order.totalPayPrice ??
        order.total_pay_price ??
        order.totalBasePrice ??
        order.total_base_price ??
        0;

    const getItemCount = (order) => {
        if (Array.isArray(order.orderItems)) return order.orderItems.length;
        if (Array.isArray(order.items)) return order.items.length;
        return 0;
    };

    const getDisplayProducts = (order) => {
        const items = order.orderItems || order.items || [];
        return items.slice(0, 2).map((item, index) => ({
            id: item.id ?? index,
            name:
                item.product?.variantName ||
                item.product?.name ||
                item.productName ||
                `Product ${index + 1}`,
            price:
                item.priceAtPurchase ?? item.price_at_purchase ?? item.salePrice ?? item.price ?? 0,
            image: item.product?.thumbnailUrl || item.product?.imageUrl || item.imageUrl || null
        }));
    };

    const getPrimaryImage = (order) => {
        const items = order.orderItems || order.items || [];
        const first = items[0];

        return first?.product?.thumbnailUrl || first?.product?.imageUrl || first?.imageUrl || null;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-green-100 text-green-700';
            case 'SHIPPING':
                return 'bg-blue-100 text-blue-700';
            case 'CONFIRMED':
                return 'bg-indigo-100 text-indigo-700';
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

    const normalizeStatus = (status) => {
        if (!status) return 'UNKNOWN';
        return status.replaceAll('_', ' ');
    };

    const needsReview = (order) => {
        return order.orderStatus === 'DELIVERED' && reviewableMap[order.id] === true;
    };

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case 'PENDING':
                return orders.filter((o) => o.orderStatus === 'PENDING');
            case 'CONFIRMED':
                return orders.filter((o) => o.orderStatus === 'CONFIRMED');
            case 'SHIPPING':
                return orders.filter((o) => o.orderStatus === 'SHIPPING');
            case 'DELIVERED':
                return orders.filter((o) => o.orderStatus === 'DELIVERED');
            case 'NEEDS_REVIEW':
                return orders.filter((o) => needsReview(o));
            case 'RETURNED':
                return orders.filter((o) => o.orderStatus === 'RETURNED');
            default:
                return orders;
        }
    }, [orders, activeTab, reviewableMap]);

    const totalSpent = useMemo(() => {
        return orders.reduce((sum, order) => sum + Number(getOrderTotal(order)), 0);
    }, [orders]);

    const activeOrdersCount = useMemo(() => {
        return orders.filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(o.orderStatus))
            .length;
    }, [orders]);

    const deliveredCount = useMemo(() => {
        return orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    }, [orders]);

    const handleOpenReview = (orderId) => {
        navigate(`/profile/orders/${orderId}/review`, {
            state: {
                backgroundLocation: location
            }
        });
    };

    const handleOpenReviewedDetails = (orderId) => {
        navigate(`/profile/orders/${orderId}/review`, {
            state: {
                backgroundLocation: location
            }
        });
    };

    const tabs = [
        { key: 'ALL', label: 'All Orders', icon: null },
        { key: 'PENDING', label: 'Pending Payment', icon: 'schedule' },
        { key: 'CONFIRMED', label: 'Awaiting Shipment', icon: 'inventory_2' },
        { key: 'SHIPPING', label: 'Awaiting Delivery', icon: 'local_shipping' },
        { key: 'DELIVERED', label: 'Completed', icon: 'check_circle' },
        { key: 'NEEDS_REVIEW', label: 'Needs Review', icon: 'star' },
        { key: 'RETURNED', label: 'Returns / Refunds', icon: 'keyboard_return' }
    ];

    return (
        <div className='min-h-screen bg-surface text-on-surface'>
            <TopNavbar />

            <div className='flex'>
                <Sidebar />

                <main className='ml-64 flex-1 px-8 pb-10 pt-24 lg:px-10'>
                    <div className='mx-auto w-full max-w-7xl'>
                        <header className='mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
                            <div>
                                <h1 className='text-4xl font-headline font-extrabold tracking-tight text-on-surface'>
                                    Order History
                                </h1>
                                <p className='mt-2 font-body text-on-surface-variant'>
                                    Manage and track your recent electronic acquisitions.
                                </p>
                            </div>

                            <div className='flex flex-wrap gap-3'>
                                <button className='flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-medium text-on-secondary-fixed-variant transition-all hover:bg-surface-container-highest'>
                                    <span className='material-symbols-outlined text-lg'>
                                        filter_list
                                    </span>
                                    Filter
                                </button>

                                <button className='rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all active:scale-95'>
                                    Download Report
                                </button>
                            </div>
                        </header>

                        <div className='mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3'>
                            <div className='rounded-xl border-l-4 border-primary bg-surface-container-lowest p-6 shadow-sm'>
                                <p className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
                                    Total Spent
                                </p>
                                <p className='mt-1 text-3xl font-headline font-bold text-on-surface'>
                                    {formatPrice(totalSpent)}
                                </p>
                            </div>

                            <div className='rounded-xl border-l-4 border-secondary bg-surface-container-lowest p-6 shadow-sm'>
                                <p className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
                                    Active Orders
                                </p>
                                <p className='mt-1 text-3xl font-headline font-bold text-on-surface'>
                                    {String(activeOrdersCount).padStart(2, '0')}
                                </p>
                            </div>

                            <div className='rounded-xl border-l-4 border-tertiary bg-surface-container-lowest p-6 shadow-sm'>
                                <p className='text-xs font-bold uppercase tracking-wider text-on-surface-variant'>
                                    Completed
                                </p>
                                <p className='mt-1 text-3xl font-headline font-bold text-on-surface'>
                                    {deliveredCount}
                                </p>
                            </div>
                        </div>

                        <div className='mb-8 border-b border-outline-variant/30'>
                            <div className='flex gap-1 overflow-x-auto'>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type='button'
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm transition-all ${
                                            activeTab === tab.key
                                                ? 'border-primary font-bold text-primary'
                                                : tab.key === 'NEEDS_REVIEW'
                                                  ? 'border-transparent font-bold text-amber-700 hover:bg-amber-50'
                                                  : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        {tab.icon && (
                                            <span className='material-symbols-outlined text-[18px]'>
                                                {tab.icon}
                                            </span>
                                        )}
                                        {tab.label}
                                        {tab.key === 'DELIVERED' && deliveredCount > 0 && (
                                            <span className='rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-bold text-on-surface'>
                                                ({deliveredCount})
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className='rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant shadow-sm'>
                                Loading orders...
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className='rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant shadow-sm'>
                                No orders found.
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 gap-8 xl:grid-cols-2'>
                                {filteredOrders.map((order) => {
                                    const products = getDisplayProducts(order);
                                    const primaryImage = getPrimaryImage(order);
                                    const total = getOrderTotal(order);
                                    const itemCount = getItemCount(order);
                                    const orderDate = getOrderDate(order);
                                    const showReviewButton = needsReview(order);
                                    const isDeliveredWithoutReviewItems =
                                        order.orderStatus === 'DELIVERED' &&
                                        reviewableMap[order.id] === false;

                                    return (
                                        <div
                                            key={order.id}
                                            className={`group rounded-xl bg-surface-container-lowest p-8 shadow-[0_12px_32px_rgba(0,26,64,0.04)] transition-all hover:shadow-[0_12px_32px_rgba(0,26,64,0.08)] ${
                                                showReviewButton
                                                    ? 'border-2 border-transparent hover:border-amber-100/50'
                                                    : ''
                                            }`}
                                        >
                                            <div className='mb-6 flex items-start justify-between gap-4'>
                                                <div className='min-w-0 flex items-center gap-4'>
                                                    <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-low'>
                                                        {primaryImage ? (
                                                            <img
                                                                src={primaryImage}
                                                                alt='Order item'
                                                                className='h-full w-full object-cover'
                                                            />
                                                        ) : (
                                                            <span className='material-symbols-outlined text-3xl text-on-surface-variant'>
                                                                inventory_2
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className='min-w-0'>
                                                        <h3 className='truncate font-headline font-bold text-on-surface'>
                                                            Order #{order.id}
                                                        </h3>
                                                        <p className='text-xs font-medium text-on-surface-variant'>
                                                            {formatDate(orderDate)} • {itemCount}{' '}
                                                            item
                                                            {itemCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className='shrink-0 flex flex-col items-end gap-2'>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(order.orderStatus)}`}
                                                    >
                                                        {normalizeStatus(order.orderStatus)}
                                                    </span>

                                                    {showReviewButton && (
                                                        <span className='flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-amber-600'>
                                                            <span className='material-symbols-outlined text-sm'>
                                                                priority_high
                                                            </span>
                                                            Action Required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='space-y-4'>
                                                {products.length > 0 ? (
                                                    products.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            className='flex items-center justify-between gap-4 border-b border-outline-variant/20 pb-4 text-sm'
                                                        >
                                                            <span className='line-clamp-1 text-on-surface-variant'>
                                                                {product.name}
                                                            </span>
                                                            <span className='shrink-0 font-bold text-on-surface'>
                                                                {formatPrice(product.price)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='border-b border-outline-variant/20 pb-4 text-sm text-on-surface-variant'>
                                                        Order details unavailable
                                                    </div>
                                                )}
                                            </div>

                                            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                                <div className='text-2xl font-headline font-extrabold text-primary'>
                                                    {formatPrice(total)}
                                                </div>

                                                {showReviewButton ? (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleOpenReview(order.id)}
                                                        className='flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-600'
                                                    >
                                                        <span className='material-symbols-outlined text-[18px]'>
                                                            rate_review
                                                        </span>
                                                        Write Review
                                                    </button>
                                                ) : isDeliveredWithoutReviewItems ? (
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            handleOpenReviewedDetails(order.id)
                                                        }
                                                        className='flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/5'
                                                    >
                                                        <span className='material-symbols-outlined text-[18px]'>
                                                            visibility
                                                        </span>
                                                        View Reviewed Items
                                                    </button>
                                                ) : order.orderStatus === 'SHIPPING' ? (
                                                    <button
                                                        type='button'
                                                        className='flex items-center justify-center gap-1 text-sm font-bold text-primary hover:underline'
                                                    >
                                                        Track Shipment
                                                        <span className='material-symbols-outlined text-sm'>
                                                            local_shipping
                                                        </span>
                                                    </button>
                                                ) : order.orderStatus === 'PENDING' ||
                                                  order.orderStatus === 'CONFIRMED' ? (
                                                    <button
                                                        type='button'
                                                        className='rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-highest'
                                                    >
                                                        Cancel Order
                                                    </button>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleOpenReview(order.id)}
                                                        className='flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/5'
                                                    >
                                                        <span className='material-symbols-outlined text-[18px]'>
                                                            visibility
                                                        </span>
                                                        Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <footer className='mt-12 flex flex-col gap-4 border-t border-outline-variant/20 pt-8 sm:flex-row sm:items-center sm:justify-between'>
                            <p className='text-sm text-on-surface-variant'>
                                Showing {filteredOrders.length} of {orders.length} orders
                            </p>

                            <div className='flex gap-2'>
                                <button
                                    type='button'
                                    className='flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-all hover:bg-surface-container-highest'
                                >
                                    <span className='material-symbols-outlined'>chevron_left</span>
                                </button>

                                <button
                                    type='button'
                                    className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-white'
                                >
                                    1
                                </button>

                                <button
                                    type='button'
                                    className='flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-all hover:bg-surface-container-highest'
                                >
                                    <span className='material-symbols-outlined'>chevron_right</span>
                                </button>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
