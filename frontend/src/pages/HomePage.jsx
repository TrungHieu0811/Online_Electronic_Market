import React, { useEffect, useState } from 'react';
import {
    Truck, ShieldCheck, Lock, Headphones
} from 'lucide-react';
import { getProducts } from '@/services/productService';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveBanners } from '@/services/bannerService';

// 👉 IMPORT PRODUCT CARD CÓ SẴN CỦA BẠN VÀO ĐÂY
import ProductCard from '@/components/productComponents/productCard';

// --- CÁC COMPONENT PHỤ TRỢ ---
const HeroSection = ({ banners }) => {
    const [current, setCurrent] = useState(0);

    // Tự động chuyển slide sau 5 giây
    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (banners.length === 0) return <div className="h-[400px] bg-gray-100 animate-pulse" />;

    const activeBanner = banners[current];
    const imageUrl = activeBanner.imageUrl?.startsWith('http')
        ? activeBanner.imageUrl
        : `http://localhost:8080/uploads/${activeBanner.imageUrl}`;

    return (
        <section className="relative bg-gray-100 overflow-hidden min-h-[500px] flex items-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.6 }}
                    className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center"
                >
                    <div className="md:w-1/2 z-10 text-center md:text-left mb-10 md:mb-0">
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#FFD700] text-[#045fae] font-bold px-3 py-1 rounded-full text-sm uppercase tracking-widest mb-4 inline-block"
                        >
                            Best Deals
                        </motion.span>
                        <h1 className="text-4xl md:text-6xl font-black text-[#045fae] leading-tight mb-6">
                            {activeBanner.title}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                            {activeBanner.description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <a href={activeBanner.linkUrl || "#"} className="bg-[#045fae] text-white px-10 py-4 rounded font-bold hover:bg-blue-800 transition shadow-lg text-center">
                                See now
                            </a>
                        </div>
                    </div>

                    <div className="md:w-1/2 relative flex justify-center">
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={imageUrl}
                            alt={activeBanner.title}
                            className="w-full h-auto max-w-lg object-contain drop-shadow-2xl"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Điều hướng Slider (Dots) */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-3 h-3 rounded-full transition-all ${index === current ? 'bg-[#045fae] w-8' : 'bg-gray-300'}`}
                    />
                ))}
            </div>
        </section>
    );
};

const HeroBanner = () => (
    <section className="relative bg-gray-100 overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 z-10 text-center md:text-left mb-10 md:mb-0">
                <span className="bg-[#FFD700] text-[#045fae] font-bold px-3 py-1 rounded-full text-sm uppercase tracking-widest mb-4 inline-block">New Arrival</span>
                <h1 className="text-4xl md:text-6xl font-black text-[#045fae] leading-tight mb-6">
                    The New Era of <br /> <span className="text-gray-900">Performance</span>
                </h1>
                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                    Experience the latest smartphone technology with the Galaxy S24 Ultra. Professional-grade camera, titanium build, and AI-powered performance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button className="bg-[#045fae] text-white px-10 py-4 rounded font-bold hover:bg-blue-800 transition shadow-lg">Shop Now</button>
                    <button className="border-2 border-[#045fae] text-[#045fae] px-10 py-4 rounded font-bold hover:bg-[#045fae] hover:text-white transition">Learn More</button>
                </div>
            </div>
            <div className="md:w-1/2 relative flex justify-center">
                <img alt="Latest Smartphone Promotion" className="w-full h-auto max-w-lg object-contain drop-shadow-2xl" src="https://placehold.co/600x600/transparent/045fae?text=Smartphone" />
            </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[#045fae] opacity-5 -skew-x-12 transform translate-x-20"></div>
    </section>
);

const ValueProposition = () => (
    <section className="container mx-auto px-4 py-12 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
                { icon: <Truck size={24} />, title: 'Free Delivery', desc: 'On all orders over $500.00' },
                { icon: <ShieldCheck size={24} />, title: 'Extended Warranty', desc: 'Shop with peace of mind' },
                { icon: <Lock size={24} />, title: 'Secure Payment', desc: '100% secure payment methods' },
                { icon: <Headphones size={24} />, title: '24/7 Support', desc: 'Expert help whenever you need' }
            ].map((prop, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4 hover:-translate-y-1 transition duration-300">
                    <div className="w-12 h-12 bg-[#045fae] text-white rounded-full flex items-center justify-center mb-4 shadow-md">{prop.icon}</div>
                    <h5 className="font-bold mb-1 text-gray-800">{prop.title}</h5>
                    <p className="text-xs text-gray-500">{prop.desc}</p>
                </div>
            ))}
        </div>
    </section>
);

// --- TRANG CHỦ CHÍNH ---
export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        const loadHomePageData = async () => {
            setLoading(true);
            try {
                // Gọi song song cả Banner và Product để tối ưu tốc độ
                const [bannerRes, productRes] = await Promise.all([
                    getActiveBanners(),
                    getProducts()
                ]);

                setBanners(bannerRes);

                // Logic xử lý products giữ nguyên như cũ
                const allProducts = productRes?.data?.content || productRes?.data || [];
                setFeaturedProducts(allProducts.filter(p => p.isFeatured).slice(0, 5));
                setBestSellers([...allProducts].sort((a, b) => b.averageRating - a.averageRating).slice(0, 10));

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadHomePageData();
    }, []);

    return (
        <div className="font-sans text-gray-900 bg-white">
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />

            {/* <Header /> */}
            <main>
                <HeroSection banners={banners} />

                {/* Section: Featured Products */}
                <section className="max-w-6xl mx-auto px-4 py-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                        <a className="text-[#045fae] font-semibold hover:underline" href="#">View All</a>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {featuredProducts.map(product => (
                                /* DÙNG CHUẨN CARD CỦA BẠN (truyền item={product}) */
                                <ProductCard key={product.id} item={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">There are no featured products at the moment.</p>
                    )}
                </section>

                {/* Section: Best Sellers */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
                                <p className="text-gray-600">Top-rated electronics this week</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex gap-4 overflow-hidden">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="min-w-[240px] h-64 bg-white rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : bestSellers.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                                {bestSellers.map(product => (
                                    <div key={product.id} className="min-w-[240px] md:min-w-[260px]">
                                        {/* DÙNG CHUẨN CARD CỦA BẠN */}
                                        <ProductCard item={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">There are no best-selling products at the moment.</p>
                        )}
                    </div>
                </section>

                <ValueProposition />
            </main>
            {/* <Footer /> */}
        </div>
    );
}