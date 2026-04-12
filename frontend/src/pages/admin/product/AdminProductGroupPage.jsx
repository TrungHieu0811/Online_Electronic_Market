import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ChevronLeft, ChevronRight, AlertCircle, Search, Filter, Plus, Edit} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

const SORT_OPTIONS = [
	{label: 'Mới nhất', value: 'newest'},
	{label: 'Tên A-Z', value: 'name_asc'},
	{label: 'Tên Z-A', value: 'name_desc'},
	{label: 'Nhiều variant', value: 'count_desc'},
	{label: 'Ít variant', value: 'count_asc'},
];

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
			<div className="h-4 bg-slate-200 rounded w-24" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-16" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-4 bg-slate-200 rounded w-20" />
		</td>
		<td className="px-4 py-2.5">
			<div className="h-8 bg-slate-200 rounded w-16" />
		</td>
	</tr>
);

export default function AdminProductGroupPage() {
	const navigate = useNavigate();

	// ── Data từ API summaries ────────────────────────────────────────────────
	const [groups, setGroups] = useState([]);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [loading, setLoading] = useState(true);

	// ── Filter/sort/search state ─────────────────────────────────────────────
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [selectedBrandId, setSelectedBrandId] = useState(null); // single (Integer)
	const [selectedCategoryId, setSelectedCategoryId] = useState(null); // single (Integer)
	const [currentSort, setCurrentSort] = useState('newest');
	const [currentPage, setCurrentPage] = useState(0);

	// ── Filter options (load 1 lần) ──────────────────────────────────────────
	const [brands, setBrands] = useState([]);
	const [categories, setCategories] = useState([]);

	// Load brand + category cho filter panel
	useEffect(() => {
		Promise.all([
			api.get('/public/brands').catch(() => ({data: []})),
			api.get('/public/categories').catch(() => ({data: []})),
		]).then(([brandRes, catRes]) => {
			setBrands(brandRes.data || []);
			setCategories(catRes.data || []);
		});
	}, []);

	// Reset page khi filter/sort thay đổi
	useEffect(() => {
		setCurrentPage(0);
	}, [searchQuery, selectedBrandId, selectedCategoryId, currentSort]);

	// ── Fetch summaries từ backend ───────────────────────────────────────────
	useEffect(() => {
		const fetchGroups = async () => {
			setLoading(true);
			try {
				const res = await api.get('/admin/product-group/summaries', {
					params: {
						search: searchQuery || undefined,
						brandId: selectedBrandId || undefined,
						categoryId: selectedCategoryId || undefined,
						page: currentPage,
						size: PAGE_SIZE,
						sort: currentSort,
					},
				});
				setGroups(res.data.content || []);
				setTotalPages(res.data.totalPages || 0);
				setTotalElements(res.data.totalElements || 0);
			} catch (e) {
				console.error('Error fetching product groups:', e);
				setGroups([]);
			} finally {
				setLoading(false);
			}
		};
		fetchGroups();
	}, [searchQuery, selectedBrandId, selectedCategoryId, currentPage, currentSort]);

	// ── Handlers ─────────────────────────────────────────────────────────────
	const handleSearch = (e) => {
		e.preventDefault();
		setSearchQuery(searchInput);
	};

	const handleClearSearch = () => {
		setSearchInput('');
		setSearchQuery('');
	};

	const handleBrandToggle = (id) => {
		setSelectedBrandId((prev) => (prev === id ? null : id));
	};

	const handleCategoryToggle = (id) => {
		setSelectedCategoryId((prev) => (prev === id ? null : id));
	};

	const handleClearAllFilters = () => {
		setSelectedBrandId(null);
		setSelectedCategoryId(null);
		setCurrentSort('newest');
		setSearchInput('');
		setSearchQuery('');
	};

	const handleDetailsClick = (groupId) => {
		navigate(`/admin/products/groups/${groupId}`);
	};

	const hasActiveFilters = selectedBrandId || selectedCategoryId || currentSort !== 'newest' || searchQuery;

	console.log('Groups: ', groups);
	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-6 space-y-4 max-w-6xl mx-auto w-full">
					{/* Page Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Manage Product Groups</h1>
							<p className="text-slate-500 mt-1 text-sm">{totalElements} product groups</p>
						</div>
						<button
							onClick={() => navigate('/admin/products/groups/create')}
							className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm w-fit"
						>
							<Plus size={18} />
							New Product Group
						</button>
					</div>

					{/* Search + Sort + Filter */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
						<form onSubmit={handleSearch} className="flex gap-2">
							<input
								type="text"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Search by group name..."
								className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
							/>
							<button
								type="submit"
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm"
							>
								<Search size={16} />
								Search
							</button>
							{searchQuery && (
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

								<button
									onClick={() => setShowFilters(!showFilters)}
									className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
										showFilters || selectedBrandId || selectedCategoryId
											? 'bg-blue-600 text-white'
											: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
									}`}
								>
									<Filter size={14} />
									Filters
									{(selectedBrandId || selectedCategoryId) && (
										<span className="ml-0.5 px-1.5 py-0.5 bg-blue-700 rounded text-xs">Active</span>
									)}
								</button>
							</div>
						</div>

						{/* Advanced Filters */}
						{showFilters && (
							<div className="border-t border-slate-100 pt-3 space-y-3">
								{brands.length > 0 && (
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand</label>
										<div className="flex flex-wrap gap-1.5">
											{brands.map((brand) => (
												<button
													key={brand.id}
													onClick={() => handleBrandToggle(brand.id)}
													className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
														selectedBrandId === brand.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
													}`}
												>
													{brand.name}
												</button>
											))}
										</div>
									</div>
								)}

								{categories.length > 0 && (
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
										<div className="flex flex-wrap gap-1.5">
											{categories.map((cat) => (
												<button
													key={cat.id}
													onClick={() => handleCategoryToggle(cat.id)}
													className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
														selectedCategoryId === cat.id
															? 'bg-blue-600 text-white'
															: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
													}`}
												>
													{cat.name}
												</button>
											))}
										</div>
									</div>
								)}

								{hasActiveFilters && (
									<button
										onClick={handleClearAllFilters}
										className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all text-xs"
									>
										Clear All
									</button>
								)}
							</div>
						)}
					</div>

					{/* Table */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50">
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Product</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Brand</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Category</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Variants</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Price</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading ? (
										Array.from({length: 8}).map((_, i) => <SkeletonRow key={i} />)
									) : groups.length > 0 ? (
										groups.map((group) => {
											const imageUrl = group.thumbnailUrl
												? group.thumbnailUrl.startsWith('/')
													? `http://localhost:8080/uploads${group.thumbnailUrl}`
													: group.thumbnailUrl
												: null;
											const hasVariants = (group.variantCount ?? 0) > 0;

											return (
												<tr key={group.groupId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
													{/* Product */}
													<td className="px-4 py-2.5">
														<div className="flex items-center gap-2 min-w-0">
															<div className="relative flex-shrink-0">
																{imageUrl ? (
																	<img src={imageUrl} alt={group.groupName} className="w-12 h-12 object-cover rounded bg-slate-100" />
																) : (
																	<div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
																		No img
																	</div>
																)}
																{group.hasFeatured && (
																	<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded font-semibold">
																		Featured
																	</span>
																)}
															</div>
															<div className="min-w-0 flex-1">
																<p className="font-medium text-slate-800 truncate text-xs max-w-xs">{group.groupName}</p>
																{!hasVariants && <p className="text-[10px] text-amber-500 font-medium mt-0.5">No products yet</p>}
															</div>
														</div>
													</td>

													{/* Brand */}
													<td className="px-4 py-2.5 text-xs text-slate-600">{group.brandName}</td>

													{/* Category */}
													<td className="px-4 py-2.5 text-xs text-slate-600">{group.categoryName}</td>

													{/* Variants */}
													<td className="px-4 py-2.5">
														<span
															className={`text-xs font-medium px-2 py-1 rounded ${
																hasVariants ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
															}`}
														>
															{group.variantCount ?? 0} variant{(group.variantCount ?? 0) !== 1 ? 's' : ''}
														</span>
													</td>
													{/* Status */}
													<td className="px-4 py-2.5">
														<span
															className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
																group.status === true || group.status === 'ACTIVE'
																	? 'bg-emerald-100 text-emerald-700'
																	: 'bg-slate-100 text-slate-600'
															}`}
														>
															{/* <p>status day: {group.status}</p> */}
															{group.status === true || group.status === 'ACTIVE' ? 'Active' : 'Inactive'}
														</span>
													</td>
													{/* Price */}
													<td className="px-4 py-2.5 text-xs font-semibold text-slate-800">
														{group.minPrice ? (
															new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(group.minPrice)
														) : (
															<span className="text-slate-400 font-normal">—</span>
														)}
													</td>

													{/* Actions */}
													<td className="px-4 py-2.5 flex items-center gap-1">
														<button
															onClick={() => handleDetailsClick(group.groupId)}
															className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-xs"
														>
															Details
															<ChevronRight size={14} />
														</button>
														<button
															onClick={() => window.open(`/admin/products/groups/edit/${group.groupId}`, '_blank')}
															className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
															title="Edit"
														>
															<Edit size={16} />
														</button>
													</td>
												</tr>
											);
										})
									) : (
										<tr>
											<td colSpan="6" className="px-4 py-12 text-center">
												<div className="flex flex-col items-center justify-center">
													<AlertCircle size={48} className="text-slate-400 mb-4" />
													<p className="text-slate-500 text-sm">
														{searchQuery ? `No results for "${searchQuery}"` : 'No product groups found'}
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
