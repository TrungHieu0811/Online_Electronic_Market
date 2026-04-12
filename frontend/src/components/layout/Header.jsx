import { Search, User, ShoppingCart, LogOut, Package, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartBadge from '../user/cart/CartBadge';

const categories = ['Mobiles', 'Laptops', 'TV & Audio', 'Appliances', 'Accessories'];

export default function Header() {
    const navigate = useNavigate();

    // Kiểm tra xem có token trong máy không để biết đã đăng nhập chưa
    const isAuthenticated = !!localStorage.getItem('token');

    // Hàm xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.info("You have logged out.");
        navigate('/');
        window.location.reload(); // Tải lại trang để Header cập nhật giao diện
    };

    return (
        <header className='sticky top-0 z-50 border-b border-gray-200 bg-white'>
            {/* Top Bar */}
            <div className='bg-[#045fae] px-4 py-2 text-xs text-white'>
                <div className='mx-auto flex max-w-7xl items-center justify-between'>
                    <span>Free International Shipping on orders over $500</span>

                    <div className='flex gap-4'>
                        <a href='#' className='hover:underline'>
                            Store Locator
                        </a>
                        <a href='#' className='hover:underline'>
                            Track Order
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Nav */}
            <nav className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4'>
                {/* Logo */}
                <a
                    href='/'
                    className='flex items-center gap-1 text-2xl font-extrabold text-[#045fae]'
                >
                    <span className='italic text-[#FFD700]'>Electro</span>Mart
                </a>

                {/* Search */}
                <div className='mx-4 flex-1 max-w-2xl'>
                    <div className='relative flex'>
                        <input
                            type='text'
                            placeholder='Search for products, brands, and more...'
                            className='w-full rounded-l-md border-2 border-[#045fae] px-4 py-2 focus:border-[#045fae] focus:outline-none'
                        />
                        <button className='rounded-r-md bg-[#045fae] px-6 py-2 text-white transition hover:opacity-90'>
                            <Search className='h-5 w-5' />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-6'>
                    
                    {/* 👉 HIỂN THỊ ĐỘNG DỰA VÀO TRẠNG THÁI LOGIN */}
                    {isAuthenticated ? (
                        // ĐÃ LOGIN: Hiện Profile, Orders, Logout
                        <div className='flex items-center gap-4 border-r pr-4 border-gray-200'>
                            <Link to='/profile' className='flex items-center gap-1 text-gray-700 hover:text-[#045fae]'>
                                <User className='h-5 w-5' />
                                <span className='hidden text-sm font-medium md:block'>Profile</span>
                            </Link>
                            
                            {/* <Link to='/profile/orders' className='flex items-center gap-1 text-gray-700 hover:text-[#045fae]'>
                                <Package className='h-5 w-5' />
                                <span className='hidden text-sm font-medium md:block'>Orders</span>
                            </Link> */}

                            <button onClick={handleLogout} className='flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors ml-2'>
                                <LogOut className='h-5 w-5' />
                                <span className='hidden text-sm font-medium md:block'>Logout</span>
                            </button>
                        </div>
                    ) : (
                        // CHƯA LOGIN: Hiện nút Login
                        <Link to='/login' className='flex items-center gap-2 text-gray-700 hover:text-[#045fae]'>
                            <LogIn className='h-6 w-6' />
                            <span className='hidden text-sm font-medium md:block'>Login</span>
                        </Link>
                    )}

                    <Link to='/cart'>
                        <CartBadge />
                    </Link>
                </div>
            </nav>

            {/* Categories */}
            <div className='border-t border-gray-100 bg-gray-50'>
                <div className='mx-auto max-w-7xl px-4'>
                    <ul className='flex overflow-x-auto whitespace-nowrap py-3 text-sm font-semibold uppercase tracking-wider text-gray-700'>
                        <li className='mr-8'>
                            <a href='#' className='flex items-center gap-2 hover:text-[#045fae]'>
                                <span className='block h-4 w-4 rounded-sm bg-[#045fae]' />
                                All Departments
                            </a>
                        </li>

                        {categories.map((item) => (
                            <li key={item} className='mr-8'>
                                <a href='#' className='hover:text-[#045fae]'>
                                    {item}
                                </a>
                            </li>
                        ))}

                        <li className='ml-auto text-red-600'>
                            <a href='#' className='hover:underline'>
                                Deals of the Day
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}