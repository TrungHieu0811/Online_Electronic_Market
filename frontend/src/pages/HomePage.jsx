import React, { useEffect, useState } from 'react';
import { Truck, ShieldCheck, Lock, Headphones, Search, User, ShoppingCart } from 'lucide-react';
import { getProducts } from '@/services/productService';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// 👉 Dùng ProductCard chuẩn của bạn để đồng bộ giao diện
import ProductCard from '@/components/productComponents/productCard';

const BASE_URL = 'http://localhost:8080';

// --- COMPONENT HERO SECTION (BANNER ĐỘNG TỪ SẢN PHẨM) ---
const HeroSection = ({ heroProducts }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (heroProducts.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % heroProducts.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroProducts.length]);

    if (heroProducts.length === 0) return <div className="h-[450px] bg-gray-50 animate-pulse flex items-center justify-center text-gray-400">Loading top deals...</div>;

    const activeProduct = heroProducts[current];

    // 🕵️‍♂️ LOGIC LẤY ẢNH CHUẨN 100% TỪ PRODUCT CARD CỦA BẠN
    const primaryImage = activeProduct.imageList?.[0]?.imageUrl || activeProduct.imageUrl;
    const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
    
    let imageUrl = "https://placehold.co/600x600/f8f9fa/045fae?text=ElectroMart"; // Ảnh mặc định nếu lỗi
    
    if (primaryImage) {
        if (primaryImage.startsWith('http')) {
            imageUrl = primaryImage;
        } else if (primaryImage.startsWith('/')) {
            imageUrl = IMAGE_BASE_URL + primaryImage;
        } else {
            imageUrl = `${IMAGE_BASE_URL}/${primaryImage}`;
        }
    }

    const productName = activeProduct.variantName || activeProduct.name;
    const description = activeProduct.summary || "Unbeatable performance with cutting-edge design. Experience the best of ElectroMart technology.";

    return (
        <section className="relative bg-gray-100 overflow-hidden min-h-[500px] flex items-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center"
                >
                    <div className="md:w-1/2 z-10 text-center md:text-left mb-10 md:mb-0">
                        <motion.span
                            className="bg-[#FFD700] text-[#045fae] font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest mb-4 inline-block"
                        >
                            Featured Tech
                        </motion.span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#045fae] leading-tight mb-6 line-clamp-2">
                            {productName}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 line-clamp-3">
                            {description}
                        </p>
                        <div className="flex justify-center md:justify-start">
                            <Link 
                                to={`/products/${activeProduct.slug || activeProduct.id}`}
                                className="bg-[#045fae] text-white px-10 py-4 rounded font-bold hover:bg-blue-800 transition shadow-lg text-center"
                            >
                                Shop Now - ${activeProduct.salePrice || activeProduct.basePrice}
                            </Link>
                        </div>
                    </div>

                    <div className="md:w-1/2 relative flex justify-center">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={imageUrl}
                            alt={productName}
                            className="w-full h-auto max-w-md max-h-[400px] object-contain drop-shadow-2xl mix-blend-multiply" 
                            // Thêm mix-blend-multiply để xóa nền trắng của ảnh (nếu có) tiệp với nền xám
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Dots điều hướng */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
                {heroProducts.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${index === current ? 'bg-[#045fae] w-8' : 'bg-gray-300'}`}
                    />
                ))}
            </div>
        </section>
    );
};

// ... (Các component Header, ValueProposition, Footer bạn giữ nguyên nhé)

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

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [heroProducts, setHeroProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const response = await getProducts();
                const allProducts = response?.data?.content || response?.data || [];

                // 1. Featured Products (Lấy sản phẩm có isFeatured)
                const featured = allProducts.filter(p => p.isFeatured === true || p.isFeatured === 1);
                setFeaturedProducts(featured.slice(0, 5));

                // 2. Best Sellers (Sắp xếp theo Rating cao nhất)
                const sortedByRating = [...allProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                setBestSellers(sortedByRating.slice(0, 10));

                // 3. Banner: Lấy 5 sản phẩm xịn nhất từ Featured
                const bannerItems = featured.length >= 5 
                    ? featured.sort((a,b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 5)
                    : sortedByRating.slice(0, 5);
                setHeroProducts(bannerItems);

            } catch (error) {
                console.error("Home load error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="font-sans text-gray-900 bg-white">
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
            
            {/* <Header /> */}
            <main>
                <HeroSection heroProducts={heroProducts} />

                <section className="max-w-6xl mx-auto px-4 py-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                        <Link to="/category/all" className="text-[#045fae] font-semibold hover:underline">View All</Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {featuredProducts.map(p => <ProductCard key={p.id} item={p} />)}
                        </div>
                    )}
                </section>

                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Best Sellers</h2>
                        <p className="text-gray-600 mb-8">Top-rated electronics this week</p>
                        
                        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                            {bestSellers.map(p => (
                                <div key={p.id} className="min-w-[240px]">
                                    <ProductCard item={p} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <ValueProposition />
            </main>
        </div>
    );
}