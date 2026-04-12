import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMagnifyingGlass, faChevronDown, faFilter} from '@fortawesome/free-solid-svg-icons';
// import api from '../../../services/api';
import ProductCard from '@/components/productComponents/productCard';
import FilterBar from '@/components/productComponents/FilterBar';
import BrandFilter from '@/components/productComponents/BrandFilter';
import CategoryFilter from '@/components/productComponents/CategoryFilter';
import {DEFAULT_FILTER_CONFIG} from '@/config/filterConfigs';
import api from '@/services/api';

const SORT_OPTIONS = [
	{label: 'Mới', value: 'createdAt,desc'},
	{label: 'Nổi bật', value: 'isFeatured,desc;createdAt,desc'},
	{label: 'Bán chạy', value: 'viewCount,desc;averageRating,desc'},
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

export default function CategoryPage() {
	const {slug} = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const [products, setProducts] = useState([]);
	const [pageData, setPageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [brands, setBrands] = useState([]);
	const [categories, setCategories] = useState([]);
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [filterConfig, setFilterConfig] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const loadFilterData = async () => {
			setLoading(true); // Bắt đầu load
			try {
				// 1. Gọi song song 4 API (thêm API lấy config từ DB)
				const [rootCatRes] = await Promise.all([api.get(`/public/categories/tree`)]);

				// 2. KIỂM TRA SLUG HỢP LỆ (Dùng rootCatRes như cũ)
				const categoriesList = rootCatRes.data || [];
				const isValidSlug = categoriesList.some((cat) => cat.slug?.toLowerCase() === slug?.toLowerCase());
				if (!isValidSlug) {
					return navigate('/404', {replace: true});
				}

				const [brandRes, catRes, configRes] = await Promise.all([
					api.get(`/public/categories/${slug}/brands`),
					api.get(`/public/categories/${slug}`),
					api.get(`/public/categories/${slug}/filter-config`), // <--- API mới từ DB
				]);

				// 3. XỬ LÝ CONFIG TỪ DATABASE
				// configRes.data chính là chuỗi JSON từ cột NVARCHAR(MAX)
				let rawConfig = configRes.data;

				// Đảm bảo dữ liệu là Object (nếu server trả về string thì parse)
				let dbConfig = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;

				// Nếu DB chưa có config cho slug này, dùng DEFAULT_FILTER_CONFIG
				if (!dbConfig) {
					dbConfig = DEFAULT_FILTER_CONFIG;
				}
console.log("db config:",dbConfig);
				// 4. CẬP NHẬT OPTIONS ĐỘNG (Brand & Sub-Category) VÀO CONFIG TỪ DB
				const updatedConfig = {
					...dbConfig,
					brand: dbConfig.brand
						? {
								...dbConfig.brand,
								options: brandRes.data.map((b) => ({id: b.id, name: b.name})),
							}
						: null,
					category: dbConfig.categories
						? {
								// Lưu ý key trong JSON của bạn là 'categories'
								...dbConfig.categories,
								options: catRes.data.map((c) => ({id: c.id, name: c.name})),
							}
						: null,
				};
				console.log(updatedConfig);
				// 5. Cập nhật các state
				setBrands(brandRes.data || []);
				setCategories(catRes.data || []);
				setFilterConfig(updatedConfig);
			} catch (e) {
				console.error('Lỗi khi fetch dữ liệu:', e);
				// Nếu lỗi API config (404), có thể dùng config mặc định tại đây
				setFilterConfig(DEFAULT_FILTER_CONFIG);
			} finally {
				setLoading(false);
			}
		};

		if (slug) {
			loadFilterData();
		}
	}, [slug, navigate]);

	const currentPage = parseInt(searchParams.get('page') || '0');
	const currentSort = searchParams.get('sort') || SORT_OPTIONS[0].value;
	const currentSearch = searchParams.get('q') || '';
	const [searchInput, setSearchInput] = useState(currentSearch);
	const [minPriceInput, setMinPriceInput] = useState(searchParams.get('minPrice') || '');
	const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get('maxPrice') || '');

	// Parse URL → filters applied
	const parseFilters = useCallback(() => {
		const attributes = {};
		const brandIds = [];
		const categoryIds = [];

		searchParams.forEach((value, key) => {
			if (key.startsWith('attributes.')) {
				const attrKey = key.replace('attributes.', '');
				attributes[attrKey] = value ? value.split(',') : [];
			} else if (key === 'brandIds') {
				brandIds.push(...(value ? value.split(',') : []));
			} else if (key === 'categoryIds') {
				categoryIds.push(...(value ? value.split(',') : []));
			}
		});

		return {
			attributes,
			brandIds,
			categoryIds,
			minPrice: searchParams.get('minPrice') || '',
			maxPrice: searchParams.get('maxPrice') || '',
		};
	}, [searchParams]);

	const filters = useMemo(() => parseFilters(), [parseFilters]);

	// Local filter state - chỉ cập nhật khi user thay đổi, chưa apply
	const [pendingFilters, setPendingFilters] = useState(filters);

	// Reset pending filters khi slug (category) thay đổi
	useEffect(() => {
		setPendingFilters(filters);
	}, [slug, filters]);

	// Build API params
	const buildApiParams = useCallback(() => {
		const sortParts = currentSort.split(',');
		const params = {
			rootSlug: slug,
			page: currentPage,
			size: PAGE_SIZE,
			...(currentSearch && {keyword: currentSearch}),
			...(filters.brandIds?.length > 0 && {brandIds: filters.brandIds.join(',')}),
			...(filters.categoryIds?.length > 0 && {categoryIds: filters.categoryIds.join(',')}),
			...(filters.minPrice && {minPrice: filters.minPrice}),
			...(filters.maxPrice && {maxPrice: filters.maxPrice}),
		};

		// Handle multi-criteria sort (separated by ;)
		if (currentSort.includes(';')) {
			params.sort = currentSort.split(';');
		} else {
			const [sortField, sortDir] = sortParts;
			params.sort = `${sortField},${sortDir}`;
		}

		Object.entries(filters.attributes).forEach(([k, arr]) => {
			if (arr?.length) params[`attributes.${k}`] = arr.join(',');
		});
		return params;
	}, [slug, currentPage, currentSort, currentSearch, filters]);

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
	}, [slug, currentPage, currentSort, currentSearch, filters]);

	// Reset pending filters when category changes
	useEffect(() => {
		setSearchParams((prev) => {
			prev.set('page', '0');
			return prev;
		});
	}, [slug]);

	// Handle filter change (local state)
	const handleFilterChange = (changed) => {
		setPendingFilters((prev) => {
			const updated = {...prev};
			if (changed.attributes) {
				updated.attributes = {
					...prev.attributes,
					...changed.attributes,
				};
			}
			if ('brandIds' in changed) updated.brandIds = changed.brandIds;
			if ('categoryIds' in changed) updated.categoryIds = changed.categoryIds;
			if ('minPrice' in changed) updated.minPrice = changed.minPrice;
			if ('maxPrice' in changed) updated.maxPrice = changed.maxPrice;
			return updated;
		});
	};

	// Apply filter to URL
	const handleApplyFilter = () => {
		if (!pendingFilters) return;
		setSearchParams((prev) => {
			// Remove old filters
			[...prev.keys()]
				.filter((k) => k.startsWith('attributes.') || ['minPrice', 'maxPrice', 'brandIds', 'categoryIds'].includes(k))
				.forEach((k) => prev.delete(k));

			// Add new filters
			if (pendingFilters.brandIds?.length > 0) {
				prev.set('brandIds', pendingFilters.brandIds.join(','));
			}
			if (pendingFilters.categoryIds?.length > 0) {
				prev.set('categoryIds', pendingFilters.categoryIds.join(','));
			}
			if (pendingFilters.attributes) {
				Object.entries(pendingFilters.attributes).forEach(([k, arr]) => {
					if (arr?.length) prev.set(`attributes.${k}`, arr.join(','));
				});
			}
			if (pendingFilters.minPrice) prev.set('minPrice', pendingFilters.minPrice);
			if (pendingFilters.maxPrice) prev.set('maxPrice', pendingFilters.maxPrice);

			prev.set('page', '0');
			return prev;
		});
	};

	const handleClearAll = () => {
		setPendingFilters({attributes: {}, brandIds: [], categoryIds: [], minPrice: '', maxPrice: ''});
		setSearchParams((prev) => {
			[...prev.keys()]
				.filter(
					(k) => k.startsWith('attributes.') || ['minPrice', 'maxPrice', 'keyword', 'brandIds', 'categoryIds'].includes(k),
				)
				.forEach((k) => prev.delete(k));
			prev.set('page', '0');
			return prev;
		});
		setSearchInput('');
	};

	// Remove single filter and apply immediately (for tag removal)
	const handleRemoveFilter = (type, value) => {
		setSearchParams((prev) => {
			if (type === 'brandIds') {
				const current = prev.get('brandIds')?.split(',') || [];
				const updated = current.filter((v) => v !== String(value));
				if (updated.length > 0) {
					prev.set('brandIds', updated.join(','));
				} else {
					prev.delete('brandIds');
				}
			} else if (type === 'categoryIds') {
				const current = prev.get('categoryIds')?.split(',') || [];
				const updated = current.filter((v) => v !== String(value));
				if (updated.length > 0) {
					prev.set('categoryIds', updated.join(','));
				} else {
					prev.delete('categoryIds');
				}
			} else if (type === 'price') {
				prev.delete('minPrice');
				prev.delete('maxPrice');
			} else if (type === 'attribute') {
				// value is {key, value}
				const current = prev.get(`attributes.${value.key}`)?.split(',') || [];
				const updated = current.filter((v) => v !== value.value);
				if (updated.length > 0) {
					prev.set(`attributes.${value.key}`, updated.join(','));
				} else {
					prev.delete(`attributes.${value.key}`);
				}
			}
			prev.set('page', '0');
			return prev;
		});
	};

	// Cancel filter modal - reset pending filters to committed filters
	const handleCancelFilter = () => {
		setPendingFilters(filters);
	};

	// Handle brand selection - update URL immediately
	const handleBrandSelect = (brandIds) => {
		setSearchParams((prev) => {
			if (brandIds.length > 0) {
				prev.set('brandIds', brandIds.join(','));
			} else {
				prev.delete('brandIds');
			}
			prev.set('page', '0');
			return prev;
		});
	};
	const handleCategorySelect = (categoryIds) => {
		setSearchParams((prev) => {
			if (categoryIds.length > 0) {
				prev.set('categoryIds', categoryIds.join(','));
			} else {
				prev.delete('categoryIds');
			}
			prev.set('page', '0');
			return prev;
		});
	};

	// Clear all brand filters
	const handleClearBrands = () => {
		handleBrandSelect([]);
	};

	// Clear all filters (brands + other filters)
	const handleClearAllFilters = () => {
		setSearchParams((prev) => {
			// Remove all filter-related params
			prev.delete('brandIds');
			prev.delete('minPrice');
			prev.delete('maxPrice');
			prev.delete('categoryIds');
			// Remove all attributes.* params
			Array.from(prev.keys()).forEach((key) => {
				if (key.startsWith('attributes.')) {
					prev.delete(key);
				}
			});
			// Remove search params
			prev.delete('q');
			prev.set('page', '0');
			return prev;
		});
		setSearchInput('');
		setMinPriceInput('');
		setMaxPriceInput('');
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
		setSearchParams((prev) => {
			if (searchInput.trim()) {
				prev.set('q', searchInput);
			} else {
				prev.delete('q');
			}
			if (minPriceInput.trim()) {
				prev.set('minPrice', minPriceInput);
			} else {
				prev.delete('minPrice');
			}
			if (maxPriceInput.trim()) {
				prev.set('maxPrice', maxPriceInput);
			} else {
				prev.delete('maxPrice');
			}
			prev.set('page', '0');
			return prev;
		});
	};

	const handleClearSearch = () => {
		setSearchInput('');
		setSearchParams((prev) => {
			prev.delete('q');
			prev.delete('minPrice');
			prev.delete('maxPrice');
			prev.set('page', '0');
			return prev;
		});
	};

	return (
		<>
			{/* Header with title */}
			<div className="bg-white">
				<div className="max-w-6xl mx-auto px-4 pt-4">
					<h1 className="text-4xl font-bold text-gray-800 capitalize">{slug?.replace(/-/g, ' ')}</h1>
					{!loading && (
						<p className="text-sm text-gray-500 mt-1">Total: {pageData?.totalElements?.toLocaleString()} products</p>
					)}
					{/* Filter Bar */}
					<FilterBar
						config={filterConfig}
						filters={pendingFilters}
						onFilterChange={handleFilterChange}
						onClearAll={handleClearAll}
						onApply={handleApplyFilter}
						onRemoveFilter={handleRemoveFilter}
						onCancel={handleCancelFilter}
						brands={brands}
						categories={categories}
						showFilterModal={showFilterModal}
						setShowFilterModal={setShowFilterModal}
					/>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 pb-6">
				{/* Toolbar */}
				<div className="flex items-center gap-3 mb-3 flex-wrap">
					{/* Filter Button */}
					<button
						onClick={() => setShowFilterModal(true)}
						className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
					>
						<FontAwesomeIcon icon={faFilter} style={{fontSize: 16}} />
						Lọc
					</button>

					{/* Clear Filter Button */}
					<button
						onClick={handleClearAllFilters}
						disabled={
							filters.brandIds.length === 0 &&
							filters.categoryIds.length === 0 &&
							Object.keys(filters.attributes).length === 0 &&
							!currentSearch &&
							!filters.minPrice &&
							!filters.maxPrice
						}
						className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
							filters.brandIds.length > 0 ||
							filters.categoryIds.length > 0 ||
							Object.keys(filters.attributes).length > 0 ||
							currentSearch ||
							filters.minPrice ||
							filters.maxPrice
								? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200 cursor-pointer'
								: 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
						}`}
					>
						✕ Xóa lọc
					</button>

					{/* Search Form - Single Row */}
					<form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 ml-auto">
						{/* Name Search */}
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Tìm kiếm theo tên..."
							className="flex-1 min-w-[150px] px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
						/>

						{/* Price Range */}
						<div className="flex flex-1 flex-nowrap items-center gap-2">
							<span className="text-sm text-gray-600 whitespace-nowrap">Giá:</span>
							<input
								type="number"
								value={minPriceInput}
								onChange={(e) => setMinPriceInput(e.target.value)}
								placeholder="Min"
								min="0"
								className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
							/>
							<span className="text-gray-400">-</span>
							<input
								type="number"
								value={maxPriceInput}
								onChange={(e) => setMaxPriceInput(e.target.value)}
								placeholder="Max"
								min="0"
								className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
							/>
						</div>

						{/* Search Button */}
						<button
							type="submit"
							className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
						>
							<FontAwesomeIcon icon={faMagnifyingGlass} style={{fontSize: 14}} />
						</button>
					</form>
				</div>

				{/* Brand Filter */}
				{brands.length > 0 && (
					<div className="mb-4">
						<BrandFilter
							brands={brands}
							selectedBrandIds={filters.brandIds || []}
							onBrandSelect={handleBrandSelect}
							onClearAll={handleClearAllFilters}
						/>
					</div>
				)}
				{/* Category Filter */}
				{categories.length > 0 && (
					<div className="mb-4">
						<CategoryFilter
							categories={categories}
							selectedCategoryIds={filters.categoryIds || []}
							onCategorySelect={handleCategorySelect}
							onClearAll={handleClearAllFilters}
						/>
					</div>
				)}

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
								<option value="salePrice,asc">Giá thấp - cao</option>
								<option value="salePrice,desc">Giá cao - thấp</option>
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
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
									return null;
								})}
								<button
									onClick={() => updateParam('page', String(currentPage + 1))}
									disabled={currentPage >= pageData.totalPages - 1}
									className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Sau
								</button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-12">
						<p className="text-gray-500">Không tìm thấy sản phẩm</p>
					</div>
				)}
			</div>
		</>
	);
}
