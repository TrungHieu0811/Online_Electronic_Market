import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';
import ProductCard from '@/components/productComponents/productCard';

const SORT_OPTIONS = [
	{label: 'Mới', value: 'createdAt,desc'},
	{label: 'Nổi bật', value: 'isFeatured,desc;createdAt,desc'},
	{label: 'Bán chạy', value: 'viewCount,desc;averageRating,desc'},
];

const PRICE_SORT_OPTIONS = [
	{label: 'Giá thấp - cao', value: 'salePrice,asc'},
	{label: 'Giá cao - thấp', value: 'salePrice,desc'},
];

const PAGE_SIZE = 12;

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

export default function ProductSearchPage() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [products, setProducts] = useState([]);
	const [pageData, setPageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showFilterModal, setShowFilterModal] = useState(false);

	const currentPage = parseInt(searchParams.get('page') || '0');
	const currentSort = searchParams.get('sort') || SORT_OPTIONS[0].value;
	const currentSearch = searchParams.get('q') || '';
	const [searchInput, setSearchInput] = useState(currentSearch);

	// Build API params - search only, no category/brand filters
	const buildApiParams = useCallback(() => {
		const sortParts = currentSort.split(',');
		const params = {
			page: currentPage,
			size: PAGE_SIZE,
			...(currentSearch && {q: currentSearch}),
		};

		// Handle multi-criteria sort (separated by ;)
		if (currentSort.includes(';')) {
			params.sort = currentSort.split(';');
		} else {
			const [sortField, sortDir] = sortParts;
			params.sort = `${sortField},${sortDir}`;
		}

		return params;
	}, [currentPage, currentSort, currentSearch]);

	// Fetch products
	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const params = buildApiParams();
				const res = await api.get('/public/products', {
					params,
					paramsSerializer: (params) => {
						// Manually serialize params to handle arrays properly
						const searchParams = new URLSearchParams();
						Object.entries(params).forEach(([key, value]) => {
							if (Array.isArray(value)) {
								value.forEach((v) => searchParams.append(key, v));
							} else if (value !== undefined && value !== null && value !== '') {
								searchParams.set(key, value);
							}
						});
						return searchParams.toString();
					},
				});
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

	// Handle sort change
	const updateParam = (key, value) => {
		setSearchParams((prev) => {
			prev.set(key, value);
			if (key !== 'page') prev.set('page', '0');
			return prev;
		});
	};

	// Handle search
	const handleSearch = (e) => {
		e.preventDefault();
		setSearchParams((prev) => {
			if (searchInput.trim()) {
				prev.set('q', searchInput);
			} else {
				prev.delete('q');
			}
			prev.set('page', '0');
			return prev;
		});
	};

	// Handle clear search
	const handleClearSearch = () => {
		setSearchInput('');
		setSearchParams((prev) => {
			prev.delete('q');
			prev.set('page', '0');
			return prev;
		});
	};

	return (
		<>
			{/* Header with title */}
			<div className="bg-white">
				<div className="mx-auto max-w-6xl px-4 py-6">
					<h1 className="text-3xl font-bold text-gray-900">
						{currentSearch ? `Kết quả tìm kiếm: "${currentSearch}"` : 'Tìm kiếm sản phẩm'}
					</h1>
					{pageData && <p className="text-sm text-gray-600 mt-2">{pageData.totalElements} sản phẩm</p>}
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 py-6">
				{/* Toolbar - Only Filter button and Clear button */}
				<div className="flex items-center gap-3 mb-3 flex-wrap">
					{/* Filter Button - Disabled for search */}
					<button
						disabled
						className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap opacity-50 cursor-not-allowed"
					>
						<span>🔍 Lọc</span>
					</button>

					{/* Clear Search Button */}
					{currentSearch && (
						<button
							onClick={handleClearSearch}
							className="px-3 py-2 text-sm font-medium rounded-lg border bg-red-100 border-red-300 text-red-600 hover:bg-red-200 cursor-pointer whitespace-nowrap"
						>
							✕ Xóa tìm kiếm
						</button>
					)}
				</div>

				{/* Search Form - Single Row */}
				<form
					onSubmit={handleSearch}
					className="flex items-center gap-3 mb-6"
				>
					{/* Name Search */}
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Tìm kiếm theo tên..."
						className="flex-1 min-w-[150px] px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
					/>

					{/* Search Button */}
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
					>
						<FontAwesomeIcon icon={faMagnifyingGlass} style={{fontSize: 14}} />
					</button>
				</form>

				{/* Sort Options */}
				<div className="flex items-center gap-3 mb-6 flex-wrap">
					<span className="text-sm text-gray-600 whitespace-nowrap">Sắp xếp theo:</span>
					<div className="flex items-center gap-4">
						{SORT_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => updateParam('sort', opt.value)}
								className={`text-sm font-medium transition-colors whitespace-nowrap relative ${
									currentSort === opt.value ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
								} ${currentSort === opt.value ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600' : ''}`}
							>
								{opt.label}
							</button>
						))}

						{/* Price Dropdown */}
						<div className="relative inline-block">
							<select
								value={currentSort.startsWith('salePrice') ? currentSort : ''}
								onChange={(e) => updateParam('sort', e.target.value)}
								className={`px-0 text-sm font-medium outline-none appearance-none bg-transparent cursor-pointer whitespace-nowrap pr-4 ${
									currentSort.startsWith('salePrice') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
								}`}
								style={{
									backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23${currentSort.startsWith('salePrice') ? '2563eb' : '4b5563'}' d='M1 4l5 4 5-4'/%3E%3C/svg%3E")`,
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'right center',
									paddingRight: '16px',
								}}
							>
								<option value="">Giá</option>
								{PRICE_SORT_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Products Grid */}
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({length: PAGE_SIZE}).map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</div>
				) : products.length > 0 ? (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
							{products.map((product) => (
								<ProductCard key={product.id} item={product} />
							))}
						</div>

						{/* Pagination */}
						{pageData?.totalPages > 1 && (
							<div className="flex items-center justify-center gap-1.5">
								<button
									onClick={() => updateParam('page', String(currentPage - 1))}
									disabled={currentPage === 0}
									className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Trước
								</button>
								{Array.from({length: pageData.totalPages}, (_, i) => {
									if (i === 0 || i === pageData.totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1))
										return (
											<button
												key={i}
												onClick={() => updateParam('page', String(i))}
												className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
													currentPage === i
														? 'bg-blue-600 text-white border-blue-600'
														: 'border-gray-200 text-gray-600 hover:bg-gray-50'
												}`}
											>
												{i + 1}
											</button>
										);
									if (i === currentPage - 2 || i === currentPage + 2)
										return (
											<span key={`ellipsis-${i}`} className="px-2 text-gray-400">
												...
											</span>
										);
								})}
								<button
									onClick={() => updateParam('page', String(currentPage + 1))}
									disabled={currentPage === pageData.totalPages - 1}
									className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Sau
								</button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-16">
						<p className="text-gray-600 text-lg">Không tìm thấy sản phẩm</p>
						<p className="text-gray-500 text-sm mt-2">Vui lòng thử từ khóa khác</p>
					</div>
				)}
			</div>
		</>
	);
}
