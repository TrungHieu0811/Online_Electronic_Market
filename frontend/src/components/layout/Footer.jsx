import { Globe, Send, Camera } from 'lucide-react';

export default function Footer() {
    return (
        <footer className='bg-gray-900 pb-8 pt-16 text-gray-300'>
            <div className='mx-auto max-w-7xl px-4'>
                <div className='mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4'>
                    {/* Brand */}
                    <div>
                        <a
                            href='/'
                            className='mb-6 flex items-center gap-1 text-2xl font-extrabold text-white'
                        >
                            <span className='italic text-[#FFD700]'>Electro</span>Mart
                        </a>

                        <p className='mb-6 text-sm leading-relaxed'>
                            ElectroMart is the world's leading destination for the latest
                            technology. We offer an unbeatable selection of high-end electronics at
                            competitive prices.
                        </p>

                        <div className='flex gap-4'>
                            <a
                                href='#'
                                className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition hover:bg-[#045fae]'
                            >
                                <Globe className='h-5 w-5' />
                            </a>

                            <a
                                href='#'
                                className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition hover:bg-[#045fae]'
                            >
                                <Send className='h-5 w-5' />
                            </a>

                            <a
                                href='#'
                                className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition hover:bg-[#045fae]'
                            >
                                <Camera className='h-5 w-5' />
                            </a>
                        </div>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h6 className='mb-6 font-bold uppercase tracking-wider text-white'>
                            Customer Support
                        </h6>
                        <ul className='space-y-4 text-sm'>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Shipping Info
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Returns & Exchanges
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Order Tracking
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    FAQs
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* About Us */}
                    <div>
                        <h6 className='mb-6 font-bold uppercase tracking-wider text-white'>
                            About Us
                        </h6>
                        <ul className='space-y-4 text-sm'>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Our Story
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Affiliate Program
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Corporate Sales
                                </a>
                            </li>
                            <li>
                                <a href='#' className='transition hover:text-white'>
                                    Newsroom
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h6 className='mb-6 font-bold uppercase tracking-wider text-white'>
                            Newsletter
                        </h6>
                        <p className='mb-4 text-sm'>
                            Subscribe to receive updates, access to exclusive deals, and more.
                        </p>

                        <form className='space-y-2'>
                            <input
                                type='email'
                                placeholder='Enter your email'
                                className='w-full rounded bg-gray-800 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-[#045fae]'
                            />
                            <button
                                type='submit'
                                className='w-full rounded bg-[#045fae] py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-90'
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className='flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row'>
                    <p className='text-xs text-gray-500'>
                        © 2023 ElectroMart Global Ltd. All rights reserved.
                    </p>

                    <div className='flex gap-6 text-xs text-gray-500'>
                        <a href='#' className='transition hover:text-white'>
                            Privacy Policy
                        </a>
                        <a href='#' className='transition hover:text-white'>
                            Terms of Service
                        </a>
                        <a href='#' className='transition hover:text-white'>
                            Cookie Settings
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
