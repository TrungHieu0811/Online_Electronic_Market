import { Search, User, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import CartBadge from '../user/cart/CartBadge';


const categories = ['Mobiles', 'Laptops', 'TV & Audio', 'Appliances', 'Accessories'];

export default function Header() {
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
                    <a href='#' className='flex items-center gap-2 hover:text-[#045fae]'>
                        <User className='h-6 w-6' />
                        <span className='hidden text-sm font-medium md:block'>Account</span>
                    </a>

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
