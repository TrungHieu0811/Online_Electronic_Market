import React, {useState, useEffect} from 'react';
import {Plus, Search, Edit2, Trash2, Package, Check, X, ChevronDown} from 'lucide-react';
import api from '@/services/api';
import {useNavigate, useLocation} from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminBrandPage() {
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	const navigate = useNavigate();
	const location = useLocation();
	const [brands, setBrands] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [notification, setNotification] = useState(null);
	const [expandedBrandId, setExpandedBrandId] = useState(null);
	const [brandCategories, setBrandCategories] = useState({});
	const [loadingCategories, setLoadingCategories] = useState(new Set());
	const [allCategories, setAllCategories] = useState([]);
	const [categoryMap, setCategoryMap] = useState({});

	useEffect(() => {
		// Kiểm tra nếu có notification từ location.state
		if (location.state?.showNotification) {
			setNotification({
				type: 'success',
				message: location.state?.message || 'Operation successful!',
			});
			// Auto-hide notification sau 5 giây
			const timer = setTimeout(() => setNotification(null), 10000);
			return () => clearTimeout(timer);
		}
	}, [location.state]);

	useEffect(() => {
		fetchAllData();
	}, []);

	const fetchAllData = async () => {
		try {
			// Fetch brands
			const brandsRes = await api.get('/public/brands');
			setBrands(brandsRes.data || []);

			// Fetch all categories to create mapping
			const catsRes = await api.get('/public/categories');
			setAllCategories(catsRes.data || []);

			// Create category ID -> name mapping
			const map = {};
			(catsRes.data || []).forEach((cat) => {
				map[cat.id] = cat.name;
			});
			setCategoryMap(map);
		} catch (e) {
			console.error('Error loading data:', e);
		} finally {
			setLoading(false);
		}
	};

	const fetchBrandCategories = async (brandId) => {
		if (brandCategories[brandId]) {
			return; // Already loaded
		}

		setLoadingCategories((prev) => new Set([...prev, brandId]));
		try {
			const res = await api.get(`/admin/brand-category/${brandId}`);
			setBrandCategories((prev) => ({
				...prev,
				[brandId]: res.data || [],
			}));
		} catch (e) {
			console.error('Error loading categories for brand:', e);
			setBrandCategories((prev) => ({
				...prev,
				[brandId]: [],
			}));
		} finally {
			setLoadingCategories((prev) => {
				const newSet = new Set(prev);
				newSet.delete(brandId);
				return newSet;
			});
		}
	};

	// Lọc brand theo ô tìm kiếm
	const filteredBrands = brands.filter(
		(brand) =>
			brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			brand.slug.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const toggleBrandExpand = async (brandId) => {
		if (expandedBrandId === brandId) {
			setExpandedBrandId(null);
		} else {
			setExpandedBrandId(brandId);
			await fetchBrandCategories(brandId);
		}
	};

	const getCategoryName = (categoryId) => {
		return categoryMap[categoryId] || `Category ${categoryId}`;
	};

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
					{/* Notification */}
					{notification && (
						<div
							className={`rounded-lg p-4 flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
								notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
							}`}
						>
							{notification.type === 'success' ? (
								<Check className="text-emerald-600 flex-shrink-0" size={20} />
							) : (
								<X className="text-red-600 flex-shrink-0" size={20} />
							)}
							<p className={`font-medium ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
								{notification.message}
							</p>
						</div>
					)}

					{/* Page Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Brand Management</h1>
							<p className="text-slate-500 text-sm">Manage brands and their categories</p>
						</div>
						<button
							onClick={() => navigate('/admin/brands/create')}
							className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm w-fit"
						>
							<Plus size={18} />
							Add New Brand
						</button>
					</div>

					{/* Search & Filter Bar */}
					<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
							<input
								type="text"
								placeholder="Search by name or slug..."
								className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					{/* Brands List */}
					<div className="space-y-3">
						{loading
							? [...Array(5)].map((_, i) => (
									<div key={i} className="h-20 bg-white rounded-lg animate-pulse border border-slate-100"></div>
								))
							: filteredBrands.map((brand) => (
									<div key={brand.id} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
										{/* Brand Row */}
										<div className="p-4 hover:bg-slate-50/50 transition-colors">
											<div className="flex items-center gap-4">
												{/* Logo */}
												<div className="flex-shrink-0">
													{brand.logoUrl ? (
														<img
															src={brand.logoUrl.startsWith('/') ? IMAGE_BASE_URL + brand.logoUrl : brand.logoUrl}
															alt={brand.name}
															className="h-12 w-12 object-contain rounded border border-slate-100"
														/>
													) : (
														<div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center">
															<Package size={18} className="text-slate-400" />
														</div>
													)}
												</div>

												{/* Brand Info */}
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-slate-800">{brand.name}</h3>
													<p className="text-xs text-slate-500 font-mono">{brand.slug}</p>
												</div>

												{/* Expand & Actions */}
												<div className="flex items-center gap-2 flex-shrink-0">
													<button
														onClick={() => toggleBrandExpand(brand.id)}
														className={`p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600 ${
															expandedBrandId === brand.id ? 'bg-slate-100' : ''
														}`}
														title="View categories"
													>
														<ChevronDown
															size={18}
															className={`transition-transform ${expandedBrandId === brand.id ? 'rotate-180' : ''}`}
														/>
													</button>
													<button
														onClick={() => navigate(`/admin/brands/edit/${brand.id}`)}
														className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
														title="Edit"
													>
														<Edit2 size={16} />
													</button>
													<button
														className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
														title="Delete"
													>
														<Trash2 size={16} />
													</button>
												</div>
											</div>
										</div>

										{/* Expanded Categories Section */}
										{expandedBrandId === brand.id && (
											<div className="border-t border-slate-100 bg-slate-50/50 p-4">
												<p className="text-xs font-semibold text-slate-600 uppercase mb-3">Categories</p>
												{loadingCategories.has(brand.id) ? (
													<div className="flex items-center gap-2">
														<div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
														<span className="text-sm text-slate-500">Loading...</span>
													</div>
												) : (
													<div className="flex flex-wrap gap-2">
														{brandCategories[brand.id] && brandCategories[brand.id].length > 0 ? (
															brandCategories[brand.id].map((catId) => (
																<span
																	key={catId}
																	className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
																>
																	{getCategoryName(catId)}
																</span>
															))
														) : (
															<span className="text-slate-400 text-sm">No categories assigned</span>
														)}
													</div>
												)}
											</div>
										)}
									</div>
								))}
					</div>

					{!loading && filteredBrands.length === 0 && (
						<div className="text-center py-20">
							<div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
								<Package size={40} />
							</div>
							<p className="text-slate-500 font-medium">No brands found matching your search.</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
