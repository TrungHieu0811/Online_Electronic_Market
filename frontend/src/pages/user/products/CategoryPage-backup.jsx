import React, {useEffect, useState, useCallback} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faXmark, faMagnifyingGlass, faChevronUp, faFilter} from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';
import ProductCard from '@/components/productComponents/productCard';

// ─── Filter config ────────────────────────────────────────────────────────────
const FILTER_CONFIGS = {
	mobile: {
		attributes: [
			{key: 'Storage', label: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB']},
			{key: 'RAM', label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB', '16GB']},
			{key: 'Display', label: 'Display', options: ['OLED', 'AMOLED', 'LCD', 'Retina']},
			{key: 'OS', label: 'OS', options: ['iOS', 'Android']},
			{key: 'Battery', label: 'Battery', options: ['3000mAh', '4000mAh', '5000mAh', '6000mAh']},
		],
	},
	laptop: {
		attributes: [
			{key: 'RAM', label: 'RAM', options: ['8GB', '16GB', '32GB', '64GB']},
			{key: 'Storage', label: 'Storage', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD']},
			{
				key: 'Processor',
				label: 'CPU',
				options: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2', 'Apple M3'],
			},
			{key: 'Display', label: 'Screen size', options: ['13 inch', '14 inch', '15.6 inch', '16 inch', '17 inch']},
			{
				key: 'Graphics',
				label: 'GPU',
				options: ['Intel Iris Xe', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'AMD Radeon'],
			},
		],
	},
	tablet: {
		attributes: [
			{key: 'Storage', label: 'Storage', options: ['64GB', '128GB', '256GB', '512GB']},
			{key: 'RAM', label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB']},
			{key: 'Display', label: 'Screen size', options: ['8 inch', '10 inch', '11 inch', '12.9 inch']},
			{key: 'OS', label: 'OS', options: ['iPadOS', 'Android']},
			{key: 'Connectivity', label: 'Connectivity', options: ['WiFi', 'WiFi + 4G', 'WiFi + 5G']},
		],
	},
	accessories: {
		attributes: [
			{key: 'Type', label: 'Type', options: ['Headphones', 'Charger', 'Cable', 'Case', 'Mouse', 'Keyboard']},
			{key: 'Connectivity', label: 'Connectivity', options: ['Bluetooth', 'Wired', 'USB-C', 'Lightning']},
		],
	},
};

function getFilterConfig(slug) {
	if (!slug) return {attributes: []};
	if (FILTER_CONFIGS[slug]) return FILTER_CONFIGS[slug];
	const key = Object.keys(FILTER_CONFIGS).find((k) => slug.includes(k));
	return key ? FILTER_CONFIGS[key] : {attributes: []};
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
	{label: 'Newest', value: 'createdAt,desc'},
	{label: 'Price: Low to High', value: 'salePrice,asc'},
	{label: 'Price: High to Low', value: 'salePrice,desc'},
	{label: 'Best Rating', value: 'averageRating,desc'},
	{label: 'Most Viewed', value: 'viewCount,desc'},
];

const PAGE_SIZE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div className="w-full bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
			<div className="h-40 bg-gray-100" />
			<div className="p-3 flex flex-col gap-2">
				<div className="h-3 bg-gray-100 rounded w-1/2" />
				<div className="h-4 bg-gray-100 rounded w-full" />
				<div className="h-4 bg-gray-100 rounded w-3/4" />
				<div className="h-3 bg-gray-100 rounded w-1/3" />
				<div className="h-6 bg-gray-100 rounded w-1/2 mt-2" />
				<div className="h-8 bg-gray-100 rounded mt-1" />
			</div>
		</div>
	);
}

function FilterSection({label, children, defaultOpen = true}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
			<button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full mb-3 group">
				<span className="text-sm font-medium text-gray-700">{label}</span>
				<FontAwesomeIcon
					icon={open ? faChevronUp : faChevronDown}
					style={{fontSize: 11}}
					className="text-gray-400 group-hover:text-gray-600 transition-colors"
				/>
			</button>
			{open && children}
		</div>
	);
}

function PriceRange({minPrice, maxPrice, onChange}) {
	const [min, setMin] = useState(minPrice || '');
	const [max, setMax] = useState(maxPrice || '');

	// sync khi URL thay đổi từ ngoài (clear all)
	useEffect(() => {
		setMin(minPrice || '');
	}, [minPrice]);
	useEffect(() => {
		setMax(maxPrice || '');
	}, [maxPrice]);

	const handleApply = () => onChange({minPrice: min, maxPrice: max});
	const handleClear = () => {
		setMin('');
		setMax('');
		onChange({minPrice: '', maxPrice: ''});
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<input
					type="number"
					placeholder="Min"
					value={min}
					onChange={(e) => setMin(e.target.value)}
					className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
				/>
				<span className="text-gray-400 flex-shrink-0">—</span>
				<input
					type="number"
					placeholder="Max"
					value={max}
					onChange={(e) => setMax(e.target.value)}
					className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
				/>
			</div>
			<div className="flex gap-2">
				<button
					onClick={handleApply}
					className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Apply
				</button>
				{(min || max) && (
					<button
						onClick={handleClear}
						className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
					>
						Clear
					</button>
				)}
			</div>
		</div>
	);
}

function FilterPanel({config, filters, onChange, onClear}) {
	const hasAnyFilter = Object.values(filters.attributes || {}).some(Boolean) || filters.minPrice || filters.maxPrice;

	return (
		<div className="bg-white border border-gray-200 rounded-2xl p-4 sticky top-4">
			<div className="flex items-center justify-between mb-4">
				<span className="text-sm font-semibold text-gray-800">Filters</span>
				{hasAnyFilter && (
					<button
						onClick={onClear}
						className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
					>
						<FontAwesomeIcon icon={faXmark} style={{fontSize: 10}} />
						Clear all
					</button>
				)}
			</div>

			{/* Price */}
			<FilterSection label="Price (USD)">
				<PriceRange
					minPrice={filters.minPrice}
					maxPrice={filters.maxPrice}
					onChange={({minPrice, maxPrice}) => onChange({minPrice, maxPrice})}
				/>
			</FilterSection>

			{/* Attributes theo category */}
			{config?.attributes?.map((attr) => (
				<FilterSection key={attr.key} label={attr.label}>
					<div className="flex flex-col gap-2">
						{attr.options.map((opt) => {
							const checked = filters.attributes?.[attr.key] === opt;
							return (
								<label key={opt} className="flex items-center gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={!!checked}
										onChange={() =>
											onChange({
												attributes: {
													...filters.attributes,
													[attr.key]: checked ? '' : opt,
												},
											})
										}
										className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
									/>
									<span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{opt}</span>
								</label>
							);
						})}
					</div>
				</FilterSection>
			))}
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CategoryPage() {
	const {slug} = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const filterConfig = getFilterConfig(slug);

	const [products, setProducts] = useState([]);
	const [pageData, setPageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showFilter, setShowFilter] = useState(false); // mobile toggle

	const currentPage = parseInt(searchParams.get('page') || '0');
	const currentSort = searchParams.get('sort') || SORT_OPTIONS[0].value;
	const currentSearch = searchParams.get('q') || '';
	const [searchInput, setSearchInput] = useState(currentSearch);

	// Parse toàn bộ filter state từ URL
	const parseFilters = useCallback(() => {
		const attributes = {};
		searchParams.forEach((value, key) => {
			if (key.startsWith('attributes.')) {
				attributes[key.replace('attributes.', '')] = value;
			}
		});
		return {
			attributes,
			minPrice: searchParams.get('minPrice') || '',
			maxPrice: searchParams.get('maxPrice') || '',
		};
	}, [searchParams]);

	const filters = parseFilters();

	// 1. Dùng JSON.stringify cho object filters.attributes
	const buildApiParams = useCallback(() => {
		const [sortField, sortDir] = currentSort.split(',');
		const params = {
			rootSlug: slug,
			page: currentPage,
			size: PAGE_SIZE,
			sort: `${sortField},${sortDir}`,
			...(currentSearch && {q: currentSearch}),
			...(filters.minPrice && {minPrice: filters.minPrice}),
			...(filters.maxPrice && {maxPrice: filters.maxPrice}),
		};

		Object.entries(filters.attributes).forEach(([k, v]) => {
			if (v) params[`attributes.${k}`] = v;
		});
		return params;

		// Thay filters.attributes bằng JSON.stringify(...)
	}, [
		slug,
		currentPage,
		currentSort,
		currentSearch,
		filters.minPrice,
		filters.maxPrice,
		JSON.stringify(filters.attributes),
	]);

	// 2. Giữ nguyên useEffect fetch
	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const res = await api.get('/public/products', {params: buildApiParams()});
				setProducts(res.data?.content ?? []);
				setPageData(res.data);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, [buildApiParams]);

	// 3. Reset page khi đổi slug (Giữ nguyên)
	useEffect(() => {
		setSearchParams((prev) => {
			prev.set('page', '0');
			return prev;
		});
	}, [slug, setSearchParams]); // Thêm setSearchParams vào dep cho đúng chuẩn linter

	// Cập nhật URL khi filter thay đổi
	const handleFilterChange = (changed) => {
		setSearchParams((prev) => {
			if (changed.attributes) {
				[...prev.keys()].filter((k) => k.startsWith('attributes.')).forEach((k) => prev.delete(k));
				Object.entries(changed.attributes).forEach(([k, v]) => {
					if (v) prev.set(`attributes.${k}`, v);
					else prev.delete(`attributes.${k}`);
				});
			}
			if ('minPrice' in changed) changed.minPrice ? prev.set('minPrice', changed.minPrice) : prev.delete('minPrice');
			if ('maxPrice' in changed) changed.maxPrice ? prev.set('maxPrice', changed.maxPrice) : prev.delete('maxPrice');
			prev.set('page', '0');
			return prev;
		});
	};

	const handleClearAll = () => {
		setSearchParams((prev) => {
			[...prev.keys()]
				.filter((k) => k.startsWith('attributes.') || ['minPrice', 'maxPrice', 'q'].includes(k))
				.forEach((k) => prev.delete(k));
			prev.set('page', '0');
			return prev;
		});
		setSearchInput('');
	};

	const updateParam = (key, value) => {
		setSearchParams((prev) => {
			prev.set(key, value);
			if (key !== 'page') prev.set('page', '0');
			return prev;
		});
	};

	const handleSearch = (e) => {
		e.preventDefault();
		updateParam('q', searchInput);
	};
	const handleClearSearch = () => {
		setSearchInput('');
		updateParam('q', '');
	};

	const activeAttrFilters = Object.entries(filters.attributes).filter(([, v]) => v);
	const hasAnyFilter = activeAttrFilters.length > 0 || filters.minPrice || filters.maxPrice;

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-gray-800 capitalize">{slug?.replace(/-/g, ' ')}</h1>
					{!loading && (
						<p className="text-sm text-gray-400 mt-0.5">{pageData?.totalElements?.toLocaleString()} products found</p>
					)}
				</div>
				{/* Mobile filter toggle */}
				<button
					onClick={() => setShowFilter((s) => !s)}
					className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl lg:hidden"
				>
					<FontAwesomeIcon icon={faFilter} style={{fontSize: 12}} />
					{showFilter ? 'Hide filters' : 'Filters'}
					{hasAnyFilter && (
						<span className="w-4 h-4 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full">
							{activeAttrFilters.length + (filters.minPrice || filters.maxPrice ? 1 : 0)}
						</span>
					)}
				</button>
			</div>

			<div className="flex gap-6">
				{/* Filter sidebar */}
				<aside className={`w-52 flex-shrink-0 ${showFilter ? 'block' : 'hidden'} lg:block`}>
					<FilterPanel config={filterConfig} filters={filters} onChange={handleFilterChange} onClear={handleClearAll} />
				</aside>

				{/* Content */}
				<div className="flex-1 min-w-0">
					{/* Toolbar */}
					<div className="flex items-center gap-3 mb-4">
						<form
							onSubmit={handleSearch}
							className="flex items-center flex-1 border border-gray-200 rounded-xl overflow-hidden"
						>
							<input
								type="text"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Search in this category..."
								className="flex-1 px-4 py-2.5 text-sm outline-none bg-white text-gray-700 placeholder-gray-400"
							/>
							{searchInput && (
								<button type="button" onClick={handleClearSearch} className="px-2 text-gray-400 hover:text-gray-600">
									<FontAwesomeIcon icon={faXmark} style={{fontSize: 12}} />
								</button>
							)}
							<button type="submit" className="px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
								<FontAwesomeIcon icon={faMagnifyingGlass} style={{fontSize: 12}} />
							</button>
						</form>

						<div className="relative flex-shrink-0">
							<select
								value={currentSort}
								onChange={(e) => updateParam('sort', e.target.value)}
								className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none cursor-pointer hover:border-gray-300 transition-colors"
							>
								{SORT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
							<FontAwesomeIcon
								icon={faChevronDown}
								style={{fontSize: 10}}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
							/>
						</div>
					</div>

					{/* Active filter tags */}
					{hasAnyFilter && (
						<div className="flex flex-wrap gap-2 mb-4">
							{activeAttrFilters.map(([k, v]) => (
								<span key={k} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
									{k}: {v}
									<button onClick={() => handleFilterChange({attributes: {...filters.attributes, [k]: ''}})}>
										<FontAwesomeIcon icon={faXmark} style={{fontSize: 9}} />
									</button>
								</span>
							))}
							{(filters.minPrice || filters.maxPrice) && (
								<span className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
									${filters.minPrice || '0'} — ${filters.maxPrice || '∞'}
									<button onClick={() => handleFilterChange({minPrice: '', maxPrice: ''})}>
										<FontAwesomeIcon icon={faXmark} style={{fontSize: 9}} />
									</button>
								</span>
							)}
							<button onClick={handleClearAll} className="text-xs text-red-500 hover:underline px-1">
								Clear all
							</button>
						</div>
					)}

					{/* Grid */}
					{loading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
							{Array.from({length: PAGE_SIZE}).map((_, i) => (
								<SkeletonCard key={i} />
							))}
						</div>
					) : products.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-gray-400">
							<FontAwesomeIcon icon={faMagnifyingGlass} style={{fontSize: 36, marginBottom: 12}} />
							<p className="text-sm">No products found</p>
							<button onClick={handleClearAll} className="mt-3 text-xs text-blue-500 hover:underline">
								Clear all filters
							</button>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
							{products.map((p) => (
								<ProductCard key={p.id} item={p} />
							))}
						</div>
					)}

					{/* Pagination */}
					{pageData?.totalPages > 1 && (
						<div className="flex items-center justify-center gap-1.5 mt-10">
							<button
								onClick={() => updateParam('page', String(currentPage - 1))}
								disabled={currentPage === 0}
								className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Prev
							</button>
							{Array.from({length: pageData.totalPages}, (_, i) => {
								if (i === 0 || i === pageData.totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
									return (
										<button
											key={i}
											onClick={() => updateParam('page', String(i))}
											className={`w-9 h-9 text-sm rounded-lg border transition-colors
												${currentPage === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
										>
											{i + 1}
										</button>
									);
								}
								if (i === currentPage - 2 || i === currentPage + 2) {
									return (
										<span key={i} className="text-gray-400 px-1">
											...
										</span>
									);
								}
								return null;
							})}
							<button
								onClick={() => updateParam('page', String(currentPage + 1))}
								disabled={currentPage >= pageData.totalPages - 1}
								className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Next
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
