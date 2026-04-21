import React, {useEffect, useState} from 'react';
import {Search, ChevronLeft, ChevronRight, Edit, Trash2, Filter} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {useProductFilters} from '@/lib/useProductFilters';

const SORT_OPTIONS = [
	{label: 'New', value: 'createdAt,desc'},
	{label: 'Featured', value: 'isFeatured,desc;createdAt,desc'},
	{label: 'Best Sellers', value: 'viewCount,desc;averageRating,desc'},
];

const PRICE_SORT_OPTIONS = [
	{label: 'Low to High', value: 'salePrice,asc'},
	{label: 'High to Low', value: 'salePrice,desc'},
];

const STOCK_SORT_OPTIONS = [
	{label: 'High to Low', value: 'stockQuantity,desc'},
	{label: 'Low to High', value: 'stockQuantity,asc'},
];

function SkeletonRow() {
	return (
		<tr className="border-b border-slate-100 animate-pulse">
			<td className="px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 bg-slate-200 rounded" />
					<div className="flex-1">
						<div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
						<div className="h-2 bg-slate-100 rounded w-1/2" />
					</div>
				</div>
			</td>
			<td className="px-6 py-4">
				<div className="h-3 bg-slate-200 rounded w-24" />
			</td>
			<td className="px-6 py-4">
				<div className="h-3 bg-slate-200 rounded w-16" />
			</td>
			<td className="px-6 py-4">
				<div className="h-3 bg-slate-200 rounded w-20" />
			</td>
			<td className="px-6 py-4">
				<div className="h-3 bg-slate-200 rounded w-16" />
			</td>
			<td className="px-6 py-4">
				<div className="h-6 bg-slate-200 rounded w-12" />
			</td>
			<td className="px-6 py-4">
				<div className="h-3 bg-slate-200 rounded w-16" />
			</td>
		</tr>
	);
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState([]);
	const [pageData, setPageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [deleteModal, setDeleteModal] = useState({isOpen: false, productId: null});
	const [deleting, setDeleting] = useState(false);
	const [brands, setBrands] = useState([]);
	const [categories, setCategories] = useState([]);
	const [showFilters, setShowFilters] = useState(false);
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	// Use the custom hook for filter logic
	const {
		searchInput,
		setSearchInput,
		minPriceInput,
		setMinPriceInput,
		maxPriceInput,
		setMaxPriceInput,
		selectedBrands,
		selectedCategories,
		currentSort,
		currentSearch,
		currentPage,
		updateParam,
		handleSearch,
		handleClearSearch,
		handleBrandChange,
		handleCategoryChange,
		handleApplyPriceFilter,
		handleClearAllFilters,
		buildApiParams,
		hasActiveFilters,
		PAGE_SIZE,
	} = useProductFilters({sortOptions: SORT_OPTIONS});

	// Load brands and categories on mount
	useEffect(() => {
		const loadBrandsAndCategories = async () => {
			try {
				const [brandRes, catRes] = await Promise.all([api.get('/public/brands'), api.get('/public/categories')]);
				setBrands(brandRes.data || []);
				setCategories(catRes.data || []);
			} catch (e) {
				console.error('Error loading brands/categories:', e);
			}
		};
		loadBrandsAndCategories();
	}, []);

	// Fetch products
	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const params = buildApiParams();
				const res = await api.get('/public/products', {
					params,
					paramsSerializer: (params) => {
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
				console.error('Error fetching products:', e);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, [buildApiParams]);

	// Handle delete product
	const handleDeleteProduct = async () => {
		if (!deleteModal.productId) return;
		setDeleting(true);
		try {
			await api.delete(`/admin/products/${deleteModal.productId}`);
			setProducts(products.filter((p) => p.id !== deleteModal.productId));
			setDeleteModal({isOpen: false, productId: null});
		} catch (e) {
			console.error('Error deleting product:', e);
			alert('Failed to delete product');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-6 space-y-4 max-w-6xl mx-auto w-full overflow-y-auto">
					{/* Page Header */}
					<div>
						<h1 className="text-2xl font-bold text-slate-800">Manage Products</h1>
						<p className="text-slate-500 mt-1 text-sm">
							{pageData ? `Total: ${pageData.totalElements} products` : 'Load products...'}
						</p>
					</div>

					{/* Toolbar */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
						{/* Search Bar */}
						<form onSubmit={handleSearch} className="flex gap-2">
							<div className="flex-1 flex gap-2">
								<input
									type="text"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder="Search by product name..."
									className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
								/>
								<button
									type="submit"
									className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all whitespace-nowrap text-sm"
								>
									<Search size={16} />
									Search
								</button>
							</div>
							{currentSearch && (
								<button
									type="button"
									onClick={handleClearSearch}
									className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition-all whitespace-nowrap text-sm"
								>
									✕ Clear
								</button>
							)}
						</form>

						{/* Sort & Filter Options */}
						<div className="flex items-center gap-3 flex-wrap">
							<span className="text-xs font-semibold text-slate-700">Sort:</span>
							<div className="flex items-center gap-2 flex-wrap">
								{SORT_OPTIONS.map((opt) => (
									<button
										key={opt.value}
										onClick={() => updateParam('sort', opt.value)}
										className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
											currentSort === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										{opt.label}
									</button>
								))}

								{/* Price Sort Dropdown */}
								<select
									value={currentSort.startsWith('salePrice') ? currentSort : ''}
									onChange={(e) => updateParam('sort', e.target.value)}
									className={`px-2.5 py-1 rounded text-xs font-medium transition-all outline-none ${
										currentSort.startsWith('salePrice')
											? 'bg-blue-600 text-white'
											: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
									}`}
								>
									<option value="">Price</option>
									{PRICE_SORT_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>

								{/* Stock Sort Dropdown */}
								<select
									value={currentSort.startsWith('stockQuantity') ? currentSort : ''}
									onChange={(e) => updateParam('sort', e.target.value)}
									className={`px-2.5 py-1 rounded text-xs font-medium transition-all outline-none ${
										currentSort.startsWith('stockQuantity')
											? 'bg-blue-600 text-white'
											: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
									}`}
								>
									<option value="">Stock</option>
									{STOCK_SORT_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>

								{/* Filter Button */}
								<button
									onClick={() => setShowFilters(!showFilters)}
									className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
										showFilters || hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
									}`}
								>
									<Filter size={14} />
									Filters
									{hasActiveFilters && <span className="ml-0.5 px-1.5 py-0.5 bg-blue-700 rounded text-xs">Active</span>}
								</button>
							</div>
						</div>

						{/* Advanced Filters */}
						{showFilters && (
							<div className="border-t border-slate-100 pt-3 space-y-3">
								{/* Brand Filter */}
								{brands.length > 0 && (
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1.5">Brands</label>
										<div className="flex flex-wrap gap-1.5">
											{brands.map((brand) => (
												<button
													key={brand.id}
													onClick={() => handleBrandChange(brand.id.toString())}
													className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
														selectedBrands.includes(brand.id.toString())
															? 'bg-blue-600 text-white'
															: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
													}`}
												>
													{brand.name}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Category Filter */}
								{categories.length > 0 && (
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1.5">Categories</label>
										<div className="flex flex-wrap gap-1.5">
											{categories.map((category) => (
												<button
													key={category.id}
													onClick={() => handleCategoryChange(category.id.toString())}
													className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
														selectedCategories.includes(category.id.toString())
															? 'bg-blue-600 text-white'
															: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
													}`}
												>
													{category.name}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Price Filter */}
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-0.5">Min Price</label>
										<input
											type="number"
											value={minPriceInput}
											onChange={(e) => setMinPriceInput(e.target.value)}
											placeholder="0"
											className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-0.5">Max Price</label>
										<input
											type="number"
											value={maxPriceInput}
											onChange={(e) => setMaxPriceInput(e.target.value)}
											placeholder="999999"
											className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
										/>
									</div>
								</div>

								{/* Filter Actions */}
								<div className="flex gap-2">
									<button
										onClick={handleApplyPriceFilter}
										className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-xs"
									>
										Apply
									</button>
									{hasActiveFilters && (
										<button
											onClick={handleClearAllFilters}
											className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all text-xs"
										>
											Clear All
										</button>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Products Table */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50">
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Product</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Viewcount</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Rating</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Category</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Brand</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Price</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Stock</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading
										? Array.from({length: PAGE_SIZE}).map((_, i) => <SkeletonRow key={i} />)
										: products.length > 0
											? products.map((product) => {
													const primaryImage = product.imageList?.[0]?.imageUrl;
													return (
														<tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
															<td className="px-4 py-2.5">
																<div className="flex items-center gap-2 min-w-0">
																	{primaryImage ? (
																		<img
																			src={primaryImage.startsWith('http') ? primaryImage : `${IMAGE_BASE_URL + primaryImage}`}
																			alt={product.variantName || product.name}
																			className="w-15 h-15 object-cover rounded flex-shrink-0"
																		/>
																	) : (
																		<div className="w-15 h-15 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
																			No
																		</div>
																	)}
																	<div className="min-w-0 flex-1">
																		<p className="font-medium text-slate-800 truncate text-xs max-w-xs">
																			{product.variantName || product.name}
																		</p>
																		<p className="text-xs text-slate-500 truncate max-w-xs">ID: {product.id}</p>
																	</div>
																</div>
															</td>
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.viewCount || 0}</td>
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.averageRating?.toFixed(1) || 'N/A'}</td>
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.category?.name || 'N/A'}</td>
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.brand?.name || 'N/A'}</td>
															<td className="px-4 py-2.5 text-xs font-semibold text-slate-800">
																${product.salePrice?.toFixed(2) || '0.00'}
															</td>
															<td className="px-4 py-2.5 text-xs text-slate-600 text-center">{product.stockQuantity || 0}</td>
															<td className="px-4 py-2.5">
																<span
																	className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
																		product.status === true || product.status === 'ACTIVE'
																			? 'bg-emerald-100 text-emerald-700'
																			: 'bg-slate-100 text-slate-600'
																	}`}
																>
																	{product.status === true || product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
																</span>
															</td>
															<td className="px-4 py-2.5">
																<div className="flex items-center gap-1">
																	<button
																		onClick={() => window.open(`/admin/products/edit/${product.slug}`, '_blank')}
																		className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
																		title="Edit"
																	>
																		<Edit size={16} />
																	</button>
																</div>
															</td>
														</tr>
													);
												})
											: !loading && (
													<tr>
														<td colSpan="7" className="px-4 py-6 text-center">
															<p className="text-slate-500 text-sm">No products found</p>
														</td>
													</tr>
												)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Pagination */}
					{pageData?.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<button
								onClick={() => updateParam('page', String(Math.max(0, currentPage - 1)))}
								disabled={currentPage === 0}
								className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
								title="Previous"
							>
								<ChevronLeft size={18} />
							</button>

							{Array.from({length: pageData.totalPages}, (_, i) => {
								if (i === 0 || i === pageData.totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
									return (
										<button
											key={i}
											onClick={() => updateParam('page', String(i))}
											className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
												currentPage === i ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
											}`}
										>
											{i + 1}
										</button>
									);
								}
								if (i === currentPage - 2 || i === currentPage + 2) {
									return (
										<span key={i} className="px-2 text-slate-400">
											...
										</span>
									);
								}
								return null;
							})}

							<button
								onClick={() => updateParam('page', String(Math.min(pageData.totalPages - 1, currentPage + 1)))}
								disabled={currentPage >= pageData.totalPages - 1}
								className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
								title="Next"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					)}
				</div>
			</main>

			{/* Delete Confirmation Modal */}
			{deleteModal.isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
						<h2 className="text-lg font-bold text-slate-800 mb-2">Delete Product?</h2>
						<p className="text-slate-600 text-sm mb-6">This action cannot be undone.</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setDeleteModal({isOpen: false, productId: null})}
								disabled={deleting}
								className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteProduct}
								disabled={deleting}
								className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all"
							>
								{deleting ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
