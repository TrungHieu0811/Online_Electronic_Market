import React, {useState, useEffect} from 'react';
import {
	Plus,
	Search,
	Edit2,
	Trash2,
	FolderTree,
	Check,
	X,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	Settings,
} from 'lucide-react';
import api from '@/services/api';
import {useNavigate, useLocation} from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminCategoryPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [categories, setCategories] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [notification, setNotification] = useState(null);
	const [expandedMain, setExpandedMain] = useState({});
	const [statusModal, setStatusModal] = useState({isOpen: false, categoryId: null, currentStatus: null});
	const [togglingStatus, setTogglingStatus] = useState(false);

	useEffect(() => {
		if (location.state?.showNotification) {
			setNotification({
				type: 'success',
				message: location.state?.message || 'Operation successful!',
			});
			const timer = setTimeout(() => setNotification(null), 10000);
			return () => clearTimeout(timer);
		}
	}, [location.state]);

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			const res = await api.get('/admin/categories');
			const sortedData = sortCategoriesHierarchy(res.data || []);
			setCategories(sortedData);
		} catch (e) {
			console.error('Error loading categories:', e);
		} finally {
			setLoading(false);
		}
	};

	const sortCategoriesHierarchy = (list) => {
		const result = [];
		const roots = list.filter((c) => c.parent === null);
		roots.forEach((root) => {
			result.push(root);
			const children = list.filter((c) => c.parent?.id === root.id);
			result.push(...children);
		});
		return result;
	};

	const filteredCategories = categories.filter(
		(cat) =>
			cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cat.slug.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const mainCategories = filteredCategories.filter((cat) => cat.parent === null);

	const getSubcategories = (mainCatId) => {
		return filteredCategories.filter((cat) => cat.parent?.id === mainCatId);
	};

	const toggleExpanded = (mainCatId) => {
		setExpandedMain((prev) => ({...prev, [mainCatId]: !prev[mainCatId]}));
	};

	const handleStatusChangeClick = (categoryId, currentStatus) => {
		setStatusModal({isOpen: true, categoryId, currentStatus});
	};

	// const confirmStatusChange = async () => {
	// 	const {categoryId} = statusModal;
	// 	setTogglingStatus(true);
	// 	try {
	// 		const res = await api.patch(`/admin/categories/changestatus/${categoryId}`);
	// 		setCategories(categories.map((c) => (c.id === categoryId ? {...c, status: res.data.status} : c)));
	// 		setStatusModal({isOpen: false, categoryId: null, currentStatus: null});
	// 		setNotification({
	// 			type: 'success',
	// 			message: 'Category status updated successfully!',
	// 		});
	// 		setTimeout(() => setNotification(null), 5000);
	// 	} catch (err) {
	// 		setNotification({
	// 			type: 'error',
	// 			message: err.response?.data?.message || 'Failed to update category status',
	// 		});
	// 	} finally {
	// 		setTogglingStatus(false);
	// 	}
	// };

	// const cancelStatusChange = () => {
	// 	setStatusModal({isOpen: false, categoryId: null, currentStatus: null});
	// };

	const getStatusColor = (status) => {
		return status === true ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';
	};

	const getStatusLabel = (status) => {
		return status === true ? 'Active' : 'Inactive';
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
							<h1 className="text-2xl font-bold text-slate-800">Category Management</h1>
							<p className="text-slate-500 text-sm">Manage product categories and hierarchy</p>
						</div>
						<button
							onClick={() => navigate('/admin/categories/create')}
							className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm w-fit"
						>
							<Plus size={18} />
							Add New Category
						</button>
					</div>

					{/* Search & Filter Bar */}
					<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
						<div className="relative">
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

					{/* Categories List */}
					<div className="space-y-3">
						{loading
							? [...Array(5)].map((_, i) => (
									<div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-slate-100"></div>
								))
							: mainCategories.map((mainCat) => {
									const subcategories = getSubcategories(mainCat.id);
									const isExpanded = expandedMain[mainCat.id] || false;

									return (
										<div key={mainCat.id} className="space-y-1">
											{/* Main Category */}
											<div className="bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all">
												<div className="px-6 py-4 flex items-center gap-4">
													{/* Toggle Button */}
													<button
														onClick={() => toggleExpanded(mainCat.id)}
														className="flex-shrink-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
														title={isExpanded ? 'Collapse' : 'Expand'}
													>
														{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
													</button>

													{/* Icon & Name */}
													<div className="flex-1 flex items-center gap-3 min-w-0">
														<div className="p-2 rounded-lg flex-shrink-0 bg-blue-50 text-blue-600">
															<FolderTree size={18} />
														</div>
														<div className="min-w-0 flex-1">
															<h3 className="font-semibold text-slate-800">{mainCat.name}</h3>
															<p className="text-xs text-slate-500 font-mono">{mainCat.slug}</p>
														</div>
													</div>

													{/* Subcategory Count */}
													{subcategories.length > 0 && (
														<div className="hidden md:flex text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0">
															{subcategories.length} item{subcategories.length !== 1 ? 's' : ''}
														</div>
													)}

													{/* Status Button */}
													<button
														// onClick={() => handleStatusChangeClick(mainCat.id, mainCat.status)}
														className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase cursor-pointer hover:opacity-80 transition-all flex-shrink-0 ${getStatusColor(
															mainCat.status,
														)}`}
													>
														{getStatusLabel(mainCat.status)}
													</button>

													{/* Actions */}
													<div className="flex items-center gap-2 flex-shrink-0">
														<button
															onClick={() => navigate(`/admin/categories/config/${mainCat.id}`)}
															className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
															title="Configure"
														>
															<Settings size={16} />
														</button>
														<button
															onClick={() => navigate(`/admin/categories/edit/${mainCat.id}`)}
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

											{/* Subcategories Container */}
											{isExpanded && subcategories.length > 0 && (
												<div className="ml-6 p-4 bg-slate-50/50 rounded-lg border border-slate-100 space-y-2">
													{subcategories.map((subCat) => (
														<div
															key={subCat.id}
															className="bg-white rounded-lg border border-slate-100 px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all"
														>
															{/* Icon & Name */}
															<div className="flex-1 flex items-center gap-3 min-w-0">
																<div className="p-1.5 rounded-lg flex-shrink-0 bg-orange-50 text-orange-600">
																	<FolderTree size={16} />
																</div>
																<div className="min-w-0 flex-1">
																	<h4 className="font-medium text-slate-700">└─ {subCat.name}</h4>
																	<p className="text-xs text-slate-500 font-mono">{subCat.slug}</p>
																</div>
															</div>

															{/* Status Badge */}
															<button
																onClick={() => handleStatusChangeClick(subCat.id, subCat.status)}
																className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer hover:opacity-80 transition-all flex-shrink-0 ${getStatusColor(
																	subCat.status,
																)}`}
															>
																{getStatusLabel(subCat.status)}
															</button>

															{/* Actions */}
															<div className="flex items-center gap-1 flex-shrink-0">
																<button
																	onClick={() => navigate(`/admin/categories/edit/${subCat.id}`)}
																	className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
																	title="Edit"
																>
																	<Edit2 size={14} />
																</button>
																<button
																	className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
																	title="Delete"
																>
																	<Trash2 size={14} />
																</button>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
					</div>

					{!loading && mainCategories.length === 0 && (
						<div className="text-center py-20">
							<div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
								<FolderTree size={40} />
							</div>
							<p className="text-slate-500 font-medium">No categories found matching your search.</p>
						</div>
					)}
				</div>
			</main>

			{/* Status Change Confirmation Modal */}
			{statusModal.isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
						<div className="flex items-center gap-4 mb-4">
							<div className="p-3 bg-amber-50 rounded-lg">
								<AlertCircle className="text-amber-600" size={24} />
							</div>
							<div>
								<h2 className="font-bold text-slate-800">Change Category Status?</h2>
								<p className="text-sm text-slate-500">
									Change to <strong>{statusModal.currentStatus === true ? 'Inactive' : 'Active'}</strong>
								</p>
							</div>
						</div>

						<p className="text-slate-600 text-sm mb-6">
							{statusModal.currentStatus === true
								? 'This category will no longer be visible to customers.'
								: 'This category will be visible to customers again.'}
						</p>

						<div className="flex gap-3 justify-end">
							<button
								onClick={cancelStatusChange}
								disabled={togglingStatus}
								className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={confirmStatusChange}
								disabled={togglingStatus}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all"
							>
								{togglingStatus ? 'Updating...' : 'Change Status'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
