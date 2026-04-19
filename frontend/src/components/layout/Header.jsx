import api from '@/services/api';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Search, User, ShoppingCart, LogOut, Package, LogIn, Home, Bell } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartBadge from '../user/cart/CartBadge';
import { getMyProfile } from '@/services/profileApi';
import {
    getMyCommentNotifications,
    markCommentNotificationAsRead,
    markAllCommentNotificationsAsRead
} from '@/services/commentNotificationApi';

const DEFAULT_VISIBLE_NOTIFICATIONS = 10;

export default function Header() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const debounceTimer = useRef(null);

    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [commentNotifications, setCommentNotifications] = useState([]);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const notificationRef = useRef(null);

    const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

    const [user, setUser] = useState([]);
    const token = localStorage.getItem('token');

    const unreadNotificationCount = commentNotifications.filter((item) => !item.isRead).length;

    const visibleNotifications = showAllNotifications
        ? commentNotifications
        : commentNotifications.slice(0, DEFAULT_VISIBLE_NOTIFICATIONS);

    const hasMoreNotifications = commentNotifications.length > DEFAULT_VISIBLE_NOTIFICATIONS;

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getMyProfile();
            setUser(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommentNotifications = async () => {
        try {
            const data = await getMyCommentNotifications();
            setCommentNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching comment notifications:', err);
            setCommentNotifications([]);
        }
    };

    const markNotificationAsReadInState = (notificationId) => {
        setCommentNotifications((prev) =>
            prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
        );
    };

    const markAllNotificationsAsReadInState = () => {
        setCommentNotifications((prev) =>
            prev.map((item) => ({
                ...item,
                isRead: true
            }))
        );
    };

    useEffect(() => {
        if (token) {
            fetchProfile();
            fetchCommentNotifications();
        } else {
            setCommentNotifications([]);
            setUser([]);
        }
    }, [token]);

    useEffect(() => {
        const keywordFromUrl = searchParams.get('keyword');
        if (keywordFromUrl) {
            setSearchInput(keywordFromUrl);
        } else {
            setSearchInput('');
        }
    }, [searchParams]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
                setShowAllNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = async (item) => {
        try {
            setShowNotificationDropdown(false);

            if (!item.isRead) {
                markNotificationAsReadInState(item.id);
            }

            navigate(`/comments/thread/${item.productId}?focusCommentId=${item.commentId}`);

            if (!item.isRead) {
                try {
                    await markCommentNotificationAsRead(item.id);
                } catch (markReadError) {
                    console.error('Mark notification as read failed:', markReadError);
                    await fetchCommentNotifications();
                }
            }
        } catch (err) {
            console.error('Error opening notification:', err);
            toast.error('Không mở được thông báo');
        }
    };

    const handleMarkAllNotificationsAsRead = async () => {
        try {
            if (unreadNotificationCount === 0) return;

            markAllNotificationsAsReadInState();

            try {
                await markAllCommentNotificationsAsRead();
            } catch (error) {
                console.error('Mark all notifications as read failed:', error);
                await fetchCommentNotifications();
            }
        } catch (err) {
            console.error('Error mark all notifications:', err);
            toast.error('Không thể đánh dấu tất cả là đã đọc');
        }
    };

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setLoading(true);
        try {
            const searchParams = {
                keyword: query,
                size: 6,
                sort: ['status,asc', 'createdAt,asc']
            };
            console.log('Params gửi đi:', searchParams);

            const res = await api.get('/public/products', {
                params: searchParams,
                paramsSerializer: {
                    indexes: null
                }
            });

            setSearchResults(res.data?.content ?? []);
            setShowResults(true);
        } catch (e) {
            console.error('Search error:', e);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/products/search?keyword=${encodeURIComponent(searchInput.trim())}`);
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchSearchResults(value);
        }, 500);
    };

    const handleProductClick = (slug) => {
        setShowResults(false);
        setSearchInput('');
        setSearchResults([]);
        navigate(`/products/${slug}`);
    };

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/categories/tree');
                setCategories(res.data || []);
            } catch (e) {
                console.error('Failed to fetch categories:', e);
            }
        };
        fetchCategories();
    }, []);

    const isAuthenticated = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.info('You have logged out.');
        navigate('/');
        window.location.reload();
    };

    return (
        <header className='sticky top-0 z-50 border-b border-gray-200 bg-white'>
            <div className='bg-[#045fae] px-4 py-2 text-xs text-white'>
                <div className='mx-auto flex max-w-6xl items-center justify-between'>
                    <span>Free International Shipping on orders over $1500</span>
                </div>
            </div>

            <div className='border-t border-gray-100 bg-gray-50'>
                <nav className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4'>
                    <a
                        href='/'
                        className='flex items-center gap-1 text-2xl font-extrabold text-[#045fae]'
                    >
                        <span className='italic text-[#FFD700]'>Electro</span>Mart
                    </a>

                    <div className='relative flex-1 max-w-md'>
                        <form className='flex' onSubmit={handleSearch}>
                            <input
                                type='text'
                                value={searchInput}
                                onChange={handleSearchInputChange}
                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                placeholder='Tìm kiếm sản phẩm...'
                                className='w-full rounded-l-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500'
                            />
                            <button
                                onClick={handleSearch}
                                className='rounded-r-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 flex-shrink-0'
                            >
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    style={{ fontSize: 14 }}
                                />
                            </button>
                        </form>

                        {showResults && searchResults.length > 0 && (
                            <div className='absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg'>
                                {loading ? (
                                    <div className='p-4 text-center text-gray-500'>
                                        Đang tìm kiếm...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className='divide-y divide-gray-100'>
                                        {searchResults.map((product) => {
                                            const primaryImage = product.imageList?.[0]?.imageUrl;
                                            const variantName = product.variants?.[0]?.name;
                                            const isActive = product.status === 'ACTIVE';

                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleProductClick(product.slug)}
                                                    className={`flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-gray-50 ${!isActive ? 'hidden' : ''}`}
                                                >
                                                    <img
                                                        src={
                                                            primaryImage?.startsWith('/')
                                                                ? IMAGE_BASE_URL + primaryImage
                                                                : primaryImage
                                                        }
                                                        alt={variantName}
                                                        className={`h-10 w-10 rounded-md border border-gray-200 object-cover ${!isActive ? 'grayscale' : ''}`}
                                                    />

                                                    <div className='min-w-0 flex-1'>
                                                        <h4 className='truncate text-sm font-medium text-gray-900'>
                                                            {product.variantName}
                                                        </h4>
                                                        <p>
                                                            <span className='text-lg text-red-600 font-lightbold'>
                                                                $
                                                                {product.salePrice?.toLocaleString(
                                                                    'en-us'
                                                                )}
                                                            </span>

                                                            {product.basePrice >
                                                                product.salePrice && (
                                                                <>
                                                                    <span className='ml-2 text-xs text-gray-400 line-through'>
                                                                        $
                                                                        {product.basePrice?.toLocaleString(
                                                                            'en-us'
                                                                        )}
                                                                    </span>
                                                                    <span className='ml-5 rounded bg-amber-50 px-2 py-0.5 text-sm font-medium text-red-600'>
                                                                        -
                                                                        {(((product.basePrice -
                                                                            product.salePrice) /
                                                                            product.basePrice) *
                                                                            100) |
                                                                            0}
                                                                        %
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className='p-4 text-center text-gray-500'>
                                        Không tìm thấy sản phẩm
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className='flex items-center gap-6'>
                        {isAuthenticated ? (
                            <div className='flex items-center gap-4 border-r border-gray-200 pr-4'>
                                <Link
                                    to='/profile'
                                    className='flex items-center gap-1 text-gray-700 hover:text-[#045fae]'
                                >
                                    <div className='h-10 w-10 overflow-hidden rounded-full border-2 border-primary/15 bg-surface-container-high'>
                                        <img
                                            src={IMAGE_BASE_URL + user?.avatarUrl}
                                            alt='Avatar'
                                            className='h-full w-full object-cover'
                                        />
                                    </div>
                                    <span>{user?.username}</span>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className='ml-2 flex items-center gap-1 text-red-500 transition-colors hover:text-red-700'
                                >
                                    <LogOut className='h-5 w-5' />
                                    <span className='hidden text-sm font-medium md:block'>
                                        Logout
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                to='/login'
                                className='flex items-center gap-2 text-gray-700 hover:text-[#045fae]'
                            >
                                <LogIn className='h-6 w-6' />
                                <span className='hidden text-sm font-medium md:block'>Login</span>
                            </Link>
                        )}

                        {isAuthenticated && (
                            <div className='relative' ref={notificationRef}>
                                <button
                                    type='button'
                                    onClick={() => setShowNotificationDropdown((prev) => !prev)}
                                    className='relative text-gray-700 transition-colors hover:text-[#045fae]'
                                >
                                    <Bell className='h-6 w-6' />

                                    {unreadNotificationCount > 0 && (
                                        <span className='absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white'>
                                            {unreadNotificationCount > 99
                                                ? '99+'
                                                : unreadNotificationCount}
                                        </span>
                                    )}
                                </button>

                                {showNotificationDropdown && (
                                    <div className='absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl'>
                                        <div className='border-b border-gray-100 px-4 py-3'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <p className='font-bold text-gray-900'>
                                                    Comment Notifications
                                                </p>

                                                {commentNotifications.length > 0 && (
                                                    <button
                                                        type='button'
                                                        onClick={handleMarkAllNotificationsAsRead}
                                                        className='text-xs font-bold text-blue-600 hover:underline disabled:opacity-50'
                                                        disabled={unreadNotificationCount === 0}
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>

                                            {commentNotifications.length > 0 && (
                                                <p className='mt-1 text-[11px] text-gray-500'>
                                                    {unreadNotificationCount} unread notification
                                                    {unreadNotificationCount !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>

                                        {commentNotifications.length === 0 ? (
                                            <div className='px-4 py-6 text-sm text-gray-500'>
                                                No notifications yet.
                                            </div>
                                        ) : (
                                            <>
                                                <div className='max-h-96 overflow-y-auto'>
                                                    {visibleNotifications.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type='button'
                                                            onClick={() =>
                                                                handleNotificationClick(item)
                                                            }
                                                            className={`w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                                                                !item.isRead
                                                                    ? 'bg-blue-50'
                                                                    : 'bg-white'
                                                            }`}
                                                        >
                                                            <p className='text-sm font-semibold text-gray-900'>
                                                                {item.title ||
                                                                    'Admin replied to your comment'}
                                                            </p>

                                                            <p className='mt-1 line-clamp-2 text-xs text-gray-600'>
                                                                {item.message ||
                                                                    'You have a new reply from admin'}
                                                            </p>

                                                            <p className='mt-1 text-[11px] text-gray-400'>
                                                                {item.createdAt
                                                                    ? new Date(
                                                                          item.createdAt
                                                                      ).toLocaleString()
                                                                    : ''}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>

                                                {hasMoreNotifications && (
                                                    <div className='border-t border-gray-100 px-4 py-3'>
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                setShowAllNotifications(
                                                                    (prev) => !prev
                                                                )
                                                            }
                                                            className='w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100'
                                                        >
                                                            {showAllNotifications
                                                                ? 'Thu gọn'
                                                                : `Xem thêm ${
                                                                      commentNotifications.length -
                                                                      DEFAULT_VISIBLE_NOTIFICATIONS
                                                                  } thông báo`}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <Link to='/cart'>
                            <CartBadge />
                        </Link>
                    </div>
                </nav>

                <div className='mx-auto max-w-6xl px-4'>
                    <ul className='flex overflow-x-auto whitespace-nowrap py-3 text-sm font-semibold uppercase tracking-wider text-gray-700'>
                        <li className='mr-8'>
                            <a href='/' className='flex items-center gap-2 hover:text-[#045fae]'>
                                <Home className='h-5 w-5' />
                                HOME
                            </a>
                        </li>

                        {categories.map((item) => (
                            <li key={item.id} className='mr-8'>
                                <Link
                                    to={`/category/${item.slug}`}
                                    className='hover:text-[#045fae]'
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </header>
    );
}
