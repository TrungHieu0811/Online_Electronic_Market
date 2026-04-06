import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import ProductCard from '@/components/productComponents/productCard';
import api from '../../services/api';

const SECTIONS = [
	{label: 'Mobile', rootSlug: 'mobile', href: '/products/category/mobile'},
	{label: 'Laptops', rootSlug: 'laptop', href: '/products/category/laptop'},
	{label: 'Accessories', rootSlug: 'accessories', href: '/products/category/accessories'},
];

function ProductSection({label, rootSlug, href}) {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetch = async () => {
			try {
				const res = await api.get('/public/products', {
					params: {rootSlug, page: 0, size: 12},
				});
				setProducts(res.data?.content ?? []);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetch();
	}, [rootSlug]);

	return (
		<div className="mb-10">
			{/* Section header */}
			<div className="flex items-center justify-between mb-4 px-1">
				<h2 className="text-lg font-semibold text-gray-800">{label}</h2>
				<Link to={href} className="text-sm font-medium text-[#045fae] hover:underline flex items-center gap-1">
					View all
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</Link>
			</div>

			{/* Cards */}
			{loading ? (
				<div className="grid grid-cols-3 sm:grid-cols-4  lg:grid-cols-6 gap-3">
					{Array.from({length: 5}).map((_, i) => (
						<div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />
					))}
				</div>
			) : products.length === 0 ? (
				<p className="text-sm text-gray-400 px-1">No products found.</p>
			) : (
				<div className="grid grid-cols-3 sm:grid-cols-4  lg:grid-cols-6 gap-3">
					{products.map((product) => (
						<ProductCard key={product.id} item={product} />
					))}
				</div>
			)}
		</div>
	);
}

export default function HeroSection() {
	return (
		<>
			{/* Hero banner */}
			<section className="relative overflow-hidden bg-gray-100">
				<div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 md:flex-row md:py-20">
					{/* Left */}
					<div className="z-10 mb-10 text-center md:mb-0 md:w-1/2 md:text-left">
						<span className="mb-4 inline-block rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold uppercase tracking-widest text-[#045fae]">
							New Arrival
						</span>
						<h1 className="mb-6 text-4xl font-black leading-tight text-[#045fae] md:text-6xl">
							The New Era of <br />
							<span className="text-gray-900">Performance</span>
						</h1>
						<p className="mb-8 max-w-lg text-lg text-gray-600">
							Experience the latest smartphone technology with the Galaxy S24 Ultra. Professional-grade camera, titanium build,
							and AI-powered performance.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
							<button className="rounded bg-[#045fae] px-10 py-4 font-bold text-white shadow-lg transition hover:bg-blue-800">
								Shop Now
							</button>
							<button className="rounded border-2 border-[#045fae] px-10 py-4 font-bold text-[#045fae] transition hover:bg-[#045fae] hover:text-white">
								Learn More
							</button>
						</div>
					</div>

					{/* Right */}
					<div className="relative flex justify-center md:w-1/2">
						<img
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJMKnCoh5HXJuFkvlKMQkD5qBEy_aEOqMDWUv95cVXLYN-GL5iDy4E9MQFiSGhaeFpM7HOjt8PilbxziZ2xUh-MUlBvpShwu1b_C4-9PaqZ8epjA_WDgAVvFwq01gy5KwGPOqIh28wSB6-nTd7alya7svssTlVvPkQcxWb74kZwvlz95wrjq9y-D7yYX6w-KzXIQ0Ie73C8lYVFoWQ30AeaVPYm5ch1xlr4fPBNxpYW18Y4pnVDU_JV84xpi0r9kQt1qOlLPCKqFZf"
							alt="Latest Smartphone Promotion"
							className="w-full max-w-lg object-contain drop-shadow-2xl"
						/>
					</div>
				</div>
				<div className="absolute right-0 top-0 h-full w-1/3 -skew-x-12 bg-[#045fae] opacity-5" />
			</section>

			{/* Product sections */}
			<div className="mx-auto max-w-7xl px-4 py-10">
				{SECTIONS.map((s) => (
					<ProductSection key={s.rootSlug} {...s} />
				))}
			</div>
		</>
	);
}
