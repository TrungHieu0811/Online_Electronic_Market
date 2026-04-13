import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ChevronLeft, ChevronRight, Search, AlertCircle, Edit, Trash2, Plus} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {useProductFilters} from '@/lib/useProductFilters';

const SORT_OPTIONS = [
	{label: 'Mới', value: 'createdAt,desc'},
	{label: 'Cũ', value: 'createdAt,asc'},
	{label: 'Nổi bật', value: 'isFeatured,desc;createdAt,desc'},
	{label: 'Bán chạy', value: 'viewCount,desc;averageRating,desc'},
	{label: 'Giá thấp - cao', value: 'salePrice,asc'},
	{label: 'Giá cao - thấp', value: 'salePrice,desc'},
];

const PRICE_SORT_OPTIONS = [];
// const SORT_OPTIONS = [
// 	{label: 'Mới nhất', value: 'newest'},
// 	{label: 'Tên A-Z', value: 'name_asc'},
// 	{label: 'Tên Z-A', value: 'name_desc'},
// 	{label: 'Nhiều variant', value: 'count_desc'},
// 	{label: 'Ít variant', value: 'count_asc'},
// ];
const PAGE_SIZE = 12;

const SkeletonRow = () => (
	<tr className="border-b border-slate-100 animate-pulse">
		<td className="px-4 py-2.5">
			<div className="h-10 bg-slate-200 rounded" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-20" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-16" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-20" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-16" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-8 bg-slate-200 rounded w-24" />
		</td>
	</tr>
);

export default function AdminProductGroupDetailsPage() {
	const {groupId} = useParams();
	const navigate = useNavigate();
	const [allProducts, setAllProducts] = useState([]);
	const [brands, setBrands] = useState([]);
	const [categories, setCategories] = useState([]);
	const [groupInfo, setGroupInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);
	const [currentSort, setCurrentSort] = useState('createdAt,desc');
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

	const brandMap = useMemo(() => {
		const map = {};
		brands.forEach((b) => {
			map[b.id] = b.name;
		});
		return map;
	}, [brands]);

	const categoryMap = useMemo(() => {
		const map = {};
		categories.forEach((c) => {
			map[c.id] = c.name;
		});
		return map;
	}, [categories]);

	const {
		searchInput,
		setSearchInput,
		minPriceInput,
		setMinPriceInput,
		maxPriceInput,
		setMaxPriceInput,
		// currentSort,
		currentSearch,
		updateParam,
		handleSearch,
		handleClearSearch,
		handleApplyPriceFilter,
		handleClearAllFilters,
		hasActiveFilters,
	} = useProductFilters({sortOptions: SORT_OPTIONS});
	const buildApiParams = useCallback(() => {
		const sortParts = currentSort.split(',');
		const params = {
			page: currentPage,
			size: PAGE_SIZE,
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

	useEffect(() => {
		const fetchMetadata = async () => {
			try {
				const [brandRes, catRes] = await Promise.all([api.get('/public/brands'), api.get('/public/categories')]);
				setBrands(brandRes.data || []);
				setCategories(catRes.data || []);
			} catch (e) {
				console.error('Error loading metadata:', e);
			}
		};
		fetchMetadata();
	}, []);

	useEffect(() => {
		const fetchGroupProducts = async () => {
			setLoading(true);
			try {
				const params = buildApiParams();

				const res = await api.get(`/public/products/group/${groupId}`, {
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
				const filteredProducts = res.data?.content || [];
				setAllProducts(filteredProducts);

				if (filteredProducts.length > 0) {
					const first = filteredProducts[0];
					setGroupInfo({
						id: first.productGroup.id,
						name: first.productGroup.name,
						brandName: brandMap[first.productGroup.brandId] || 'N/A',
						categoryName: categoryMap[first.productGroup.categoryId] || 'N/A',
					});
				}
			} catch (e) {
				console.error('Error fetching products:', e);
				setAllProducts([]);
				setTotalPages(res.data.totalPages || 0);
				setTotalElements(res.data.totalElements || 0);
			} finally {
				setLoading(false);
			}
		};
		fetchGroupProducts();
	}, [groupId, brandMap, categoryMap, currentPage, currentSort]);

	const filteredProducts = useMemo(() => {
		let filtered = [...allProducts];

		if (currentSearch) {
			const q = currentSearch.toLowerCase();
			filtered = filtered.filter((p) => p.variantName?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q));
		}
		if (minPriceInput) filtered = filtered.filter((p) => (p.salePrice || p.basePrice) >= parseFloat(minPriceInput));
		if (maxPriceInput) filtered = filtered.filter((p) => (p.salePrice || p.basePrice) <= parseFloat(maxPriceInput));

		if (currentSort) {
			const sortCriteria = currentSort.split(';');
			filtered.sort((a, b) => {
				for (const criteria of sortCriteria) {
					const [field, direction] = criteria.split(',');
					let aVal, bVal;
					switch (field) {
						case 'createdAt':
							aVal = new Date(a.createdAt || 0).getTime();
							bVal = new Date(b.createdAt || 0).getTime();
							break;
						case 'salePrice':
							aVal = a.salePrice || a.basePrice || 0;
							bVal = b.salePrice || b.basePrice || 0;
							break;
						case 'isFeatured':
							aVal = a.isFeatured ? 1 : 0;
							bVal = b.isFeatured ? 1 : 0;
							break;
						case 'viewCount':
							aVal = a.viewCount || 0;
							bVal = b.viewCount || 0;
							break;
						case 'averageRating':
							aVal = a.averageRating || 0;
							bVal = b.averageRating || 0;
							break;
						default:
							return 0;
					}
					if (aVal !== bVal) return direction === 'desc' ? bVal - aVal : aVal - bVal;
				}
				return 0;
			});
		}
		return filtered;
	}, [allProducts, currentSearch, minPriceInput, maxPriceInput, currentSort]);

	// const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />
			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />
				<div className="p-6 space-y-4 max-w-6xl mx-auto w-full overflow-y-auto">
					{/* Page Header */}
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/admin/products/groups')}
							className="p-2 hover:bg-slate-200 rounded-lg transition-all"
						>
							<ChevronLeft size={24} className="text-slate-700" />
						</button>
						<div className="flex-1">
							<h1 className="text-2xl font-bold text-slate-800">{groupInfo ? groupInfo.name : 'Product Group'}</h1>
							{groupInfo && (
								<p className="text-slate-500 mt-1 text-sm">
									{groupInfo.brandName} • {groupInfo.categoryName} • {filteredProducts.length} variants
								</p>
							)}
						</div>
						<button
							onClick={() => navigate(`/admin/products/groups/addVariant/${groupId}`)}
							className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm w-fit"
						>
							<Plus size={18} />
							Add New Variant
						</button>
					</div>

					{/* Toolbar */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
						<form onSubmit={handleSearch} className="flex gap-2">
							<input
								type="text"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Search variant..."
								className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
							/>
							<button
								type="submit"
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm"
							>
								<Search size={16} />
								Search
							</button>
							{currentSearch && (
								<button
									type="button"
									onClick={handleClearSearch}
									className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition-all text-sm"
								>
									✕ Clear
								</button>
							)}
						</form>

						{/* Sort + Filter toggle */}
						<div className="flex items-center gap-3 flex-wrap">
							<span className="text-xs font-semibold text-slate-700">Sort:</span>
							<div className="flex items-center gap-2 flex-wrap">
								{SORT_OPTIONS.map((opt) => (
									<button
										key={opt.value}
										onClick={() => setCurrentSort(opt.value)}
										className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
											currentSort === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
						{/* Sort */}
						{/* <div className="flex items-center gap-3 flex-wrap">
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
							</div>
						</div> */}

						{/* Price Filter */}
						{/* <div className="flex gap-2 flex-wrap items-end">
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-0.5">Min Price</label>
								<input
									type="number"
									value={minPriceInput}
									onChange={(e) => setMinPriceInput(e.target.value)}
									placeholder="0"
									className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-0.5">Max Price</label>
								<input
									type="number"
									value={maxPriceInput}
									onChange={(e) => setMaxPriceInput(e.target.value)}
									placeholder="999999"
									className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
								/>
							</div>
							<button
								onClick={handleApplyPriceFilter}
								className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-xs"
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
						</div> */}
					</div>

					{/* Table */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50">
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Product</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Price</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Stock</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Rating</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading
										? Array.from({length: 8}).map((_, i) => <SkeletonRow key={i} />)
										: allProducts.length > 0
											? allProducts.map((product) => {
													const imageUrl = product.imageList?.[0]?.imageUrl || '/placeholder.jpg';
													return (
														<tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
															{/* Product */}
															<td className="px-4 py-2.5">
																<div className="flex items-center gap-2 min-w-0">
																	<div className="relative flex-shrink-0">
																		<img
																			src={imageUrl.startsWith('http') ? imageUrl : `${IMAGE_BASE_URL + imageUrl}`}
																			alt={product.variantName}
																			className="w-12 h-12 object-cover rounded"
																		/>
																		{product.isFeatured && (
																			<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded font-semibold">
																				Featured
																			</span>
																		)}
																	</div>
																	<div className="min-w-0 flex-1">
																		<p className="font-medium text-slate-800 truncate text-xs max-w-xs">{product.variantName}</p>
																		{product.summary && <p className="text-xs text-slate-400 truncate max-w-xs">{product.summary}</p>}
																	</div>
																</div>
															</td>

															{/* Price */}
															<td className="px-4 py-2.5 text-xs font-semibold text-slate-800">
																{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(
																	product.salePrice || product.basePrice,
																)}
															</td>

															{/* Stock */}
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.stockQuantity || 0}</td>

															{/* Rating */}
															<td className="px-4 py-2.5 text-xs text-slate-600">{product.averageRating?.toFixed(1) || 'N/A'}</td>

															{/* Status */}
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

															{/* Actions */}
															<td className="px-4 py-2.5">
																<div className="flex items-center gap-1">
																	<button
																		onClick={() => window.open(`/admin/products/edit/${product.slug}`, '_blank')}
																		className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
																		title="Edit"
																	>
																		<Edit size={16} />
																	</button>
																	<button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all" title="Delete">
																		<Trash2 size={16} />
																	</button>
																</div>
															</td>
														</tr>
													);
												})
											: !loading && (
													<tr>
														<td colSpan="6" className="px-4 py-12 text-center">
															<div className="flex flex-col items-center justify-center">
																<AlertCircle size={48} className="text-slate-400 mb-4" />
																<p className="text-slate-500 text-sm">
																	{currentSearch ? `No results for "${currentSearch}"` : 'No products found'}
																</p>
															</div>
														</td>
													</tr>
												)}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
								<button
									onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
									disabled={currentPage === 0}
									className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
								>
									<ChevronLeft size={18} />
								</button>

								{Array.from({length: totalPages}, (_, i) => {
									if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
										return (
											<button
												key={i}
												onClick={() => setCurrentPage(i)}
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
									onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
									disabled={currentPage >= totalPages - 1}
									className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
								>
									<ChevronRight size={18} />
								</button>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
