import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, Check, X, AlertCircle, Upload, ImageIcon} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminBrandEditPage() {
	const {id} = useParams();
	const navigate = useNavigate();
	const fileInputRef = useRef(null);

	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	const [brand, setBrand] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [allCategories, setAllCategories] = useState([]);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
	const [initialCategoryIds, setInitialCategoryIds] = useState([]);
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [statusModal, setStatusModal] = useState({isOpen: false, togglingStatus: false});

	// Image upload states
	const [logoFile, setLogoFile] = useState(null);
	const [logoPreview, setLogoPreview] = useState(null);
	const [uploadingLogo, setUploadingLogo] = useState(false);

	useEffect(() => {
		fetchData();
	}, [id]);

	const fetchData = async () => {
		try {
			const brandRes = await api.get(`/admin/brands/${id}`);
			setBrand(brandRes.data);

			const catRes = await api.get('/public/categories/tree');
			setAllCategories(catRes.data || []);

			const currentCategoryIds = await api.get(`/admin/brand-category/${id}`).then((res) => res.data);
			setInitialCategoryIds(currentCategoryIds || []);
			setSelectedCategoryIds(currentCategoryIds || []);
		} catch (e) {
			console.error('Error loading data:', e);
			setErrorMessage('Failed to load brand details');
		} finally {
			setLoading(false);
		}
	};

	// ─── Image Upload ────────────────────────────────────────────────────────────

	const handleLogoFileChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Basic validation
		if (!file.type.startsWith('image/')) {
			setErrorMessage('Please select a valid image file.');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setErrorMessage('Image size must be less than 5MB.');
			return;
		}

		setLogoFile(file);
		setLogoPreview(URL.createObjectURL(file));
		setErrorMessage('');
	};

	const handleUploadLogo = async () => {
		if (!logoFile) return;

		setUploadingLogo(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			const formData = new FormData();
			formData.append('name', brand.name);
			formData.append('slug', brand.slug);
			formData.append('logoFile', logoFile);

			const res = await api.put(`/admin/brands/${id}`, formData, {
				headers: {'Content-Type': 'multipart/form-data'},
			});

			setBrand((prev) => ({...prev, ...res.data}));
			setLogoFile(null);
			setLogoPreview(null);
			setSuccessMessage('Brand logo updated successfully!');
			setTimeout(() => setSuccessMessage(''), 5000);
		} catch (err) {
			setErrorMessage(err.response?.data?.message || 'Failed to update brand logo');
		} finally {
			setUploadingLogo(false);
		}
	};

	const handleCancelLogoChange = () => {
		setLogoFile(null);
		setLogoPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	// ─── Categories ──────────────────────────────────────────────────────────────

	const handleCategoryToggle = (categoryId) => {
		// NOTE: Previously, initial categories (initialCategoryIds) were locked and
		// could not be removed — only new categories could be added. That restriction
		// has been removed below to allow full category management. The original guard
		// is commented out in case you want to restore it:
		//
		// if (initialCategoryIds.includes(categoryId)) {
		//   return; // Skip toggle for initial categories
		// }

		setSelectedCategoryIds((prev) =>
			prev.includes(categoryId) ? prev.filter((cid) => cid !== categoryId) : [...prev, categoryId],
		);
	};

	const handleSubmitCategories = async (e) => {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		let tempErrors = {};
		if (selectedCategoryIds.length === 0) {
			tempErrors.categories = 'Please select at least one category';
		}
		setErrors(tempErrors);

		if (Object.keys(tempErrors).length > 0) {
			window.scrollTo({top: 0, behavior: 'smooth'});
			return;
		}

		setSaving(true);
		try {
			await api.post(`/admin/brand-category/${id}/categories`, selectedCategoryIds);

			setSuccessMessage('Brand categories updated successfully!');
			setTimeout(() => {
				navigate('/admin/brands', {
					state: {showNotification: true, message: 'Brand has been updated successfully!'},
				});
			}, 1500);
		} catch (err) {
			setErrorMessage(err.response?.data?.message || 'Failed to update brand');
		} finally {
			setSaving(false);
		}
	};

	// ─── Status ──────────────────────────────────────────────────────────────────

	const handleStatusChangeClick = () => {
		setStatusModal({...statusModal, isOpen: true});
	};

	const confirmStatusChange = async () => {
		setStatusModal({...statusModal, togglingStatus: true});
		try {
			const res = await api.patch(`/admin/brands/${id}/status`);
			setBrand({...brand, status: res.data.status});
			setStatusModal({isOpen: false, togglingStatus: false});
			setSuccessMessage('Brand status updated successfully!');
			const timer = setTimeout(() => setSuccessMessage(''), 5000);
			return () => clearTimeout(timer);
		} catch (err) {
			setErrorMessage(err.response?.data?.message || 'Failed to update brand status');
			setStatusModal({isOpen: false, togglingStatus: false});
		}
	};

	const cancelStatusChange = () => {
		setStatusModal({isOpen: false, togglingStatus: false});
	};

	const getStatusColor = (status) =>
		status === true ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';

	const getStatusLabel = (status) => (status === true ? 'Active' : 'Inactive');

	const currentLogoSrc = brand?.logoUrl
		? brand.logoUrl.startsWith('/')
			? IMAGE_BASE_URL + brand.logoUrl
			: brand.logoUrl
		: null;

	// ─── Loading / Not Found ─────────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3 text-slate-400">
							<div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
							<span className="text-sm">Loading...</span>
						</div>
					</div>
				</main>
			</div>
		);
	}

	if (!brand) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8 flex items-center justify-center">
						<p className="text-slate-500">Brand not found</p>
					</div>
				</main>
			</div>
		);
	}

	// ─── Render ──────────────────────────────────────────────────────────────────

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
					{/* Page Header */}
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/admin/brands')}
							className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
							title="Back"
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Edit: {brand.name}</h1>
							<p className="text-slate-500 text-sm">Update logo, categories and status</p>
						</div>
					</div>

					{/* Success Message */}
					{successMessage && (
						<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
							<Check className="text-emerald-600 flex-shrink-0" size={20} />
							<p className="text-emerald-700 font-medium">{successMessage}</p>
						</div>
					)}

					{/* Error Message */}
					{errorMessage && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
							<X className="text-red-600 flex-shrink-0" size={20} />
							<p className="text-red-700 font-medium">{errorMessage}</p>
						</div>
					)}

					{/* Form Card */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100">
						<div className="p-6 space-y-6">
							{/* ── Brand Info & Logo ── */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
								{/* Logo upload */}
								<div className="space-y-3">
									<label className="block text-xs font-semibold text-slate-600 uppercase">Logo</label>

									<div className="flex items-center gap-4">
										{/* Preview */}
										<div className="flex-shrink-0 h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
											{logoPreview ? (
												<img src={logoPreview} alt="Preview" className="h-full w-full object-contain" />
											) : currentLogoSrc ? (
												<img src={currentLogoSrc} alt={brand.name} className="h-full w-full object-contain" />
											) : (
												<ImageIcon size={28} className="text-slate-300" />
											)}
										</div>

										{/* Controls */}
										<div className="flex-1 space-y-2">
											<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />

											{!logoFile ? (
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
												>
													<Upload size={14} />
													Choose new logo
												</button>
											) : (
												<div className="space-y-2">
													<p className="text-xs text-slate-500 truncate max-w-[160px]">{logoFile.name}</p>
													<div className="flex gap-2">
														<button
															type="button"
															onClick={handleUploadLogo}
															disabled={uploadingLogo}
															className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all"
														>
															{uploadingLogo ? (
																<>
																	<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
																	Uploading...
																</>
															) : (
																<>
																	<Check size={13} />
																	Upload
																</>
															)}
														</button>
														<button
															type="button"
															onClick={handleCancelLogoChange}
															disabled={uploadingLogo}
															className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
														>
															Cancel
														</button>
													</div>
												</div>
											)}
											<p className="text-xs text-slate-400">JPG, PNG, WebP · max 5 MB</p>
										</div>
									</div>
								</div>

								{/* Name / Slug / Status */}
								<div className="space-y-4">
									<div>
										<label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Brand Name</label>
										<p className="font-semibold text-slate-800">{brand.name}</p>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slug</label>
										<p className="font-mono text-slate-600 text-sm">{brand.slug}</p>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Status</label>
										<div className="flex items-center gap-3">
											<button
												onClick={handleStatusChangeClick}
												className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase cursor-pointer hover:opacity-80 transition-all ${getStatusColor(brand.status)}`}
											>
												{getStatusLabel(brand.status)}
											</button>
											<p className="text-xs text-slate-500">Click to toggle</p>
										</div>
									</div>
								</div>
							</div>

							{/* ── Categories ── */}
							<form onSubmit={handleSubmitCategories} className="space-y-4">
								<div>
									<label
										className={`block text-xs font-semibold uppercase mb-2 ${errors.categories ? 'text-red-600' : 'text-slate-600'}`}
									>
										Categories *
									</label>

									<div
										className={`grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg transition-all ${
											errors.categories ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
										}`}
									>
										{allCategories.map((cat) => {
											const isSelected = selectedCategoryIds.includes(cat.id);

											// NOTE: Previously categories present on page load (initialCategoryIds)
											// were shown with a lock icon and their checkbox was disabled so they
											// could not be deselected. That UI has been removed to allow freely
											// adding/removing any category. Restored snippet:
											//
											// const isInitial = initialCategoryIds.includes(cat.id);
											// <label className={isSelected
											//   ? isInitial
											//     ? 'border-emerald-500 bg-emerald-50 text-emerald-700 cursor-not-allowed'
											//     : 'border-blue-500 bg-blue-50 text-blue-700'
											//   : 'border-slate-200 hover:bg-slate-100'}>
											//   <input ... disabled={isInitial} />
											//   {isInitial && <Lock size={12} className="ml-auto" />}
											// </label>

											return (
												<label
													key={cat.id}
													className={`flex items-center gap-2 p-2 border rounded-lg transition-all text-sm cursor-pointer ${
														isSelected
															? 'border-blue-500 bg-blue-50 text-blue-700'
															: 'border-slate-200 hover:bg-slate-100 text-slate-700'
													}`}
												>
													<input
														type="checkbox"
														className="w-3 h-3 rounded"
														checked={isSelected}
														onChange={() => handleCategoryToggle(cat.id)}
													/>
													<span className="text-xs">{cat.name}</span>
												</label>
											);
										})}
									</div>

									{errors.categories && <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ {errors.categories}</p>}
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2 pt-4 border-t border-slate-100">
									<button
										type="submit"
										disabled={saving}
										className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-all text-sm"
									>
										{saving ? 'Saving...' : 'Save Changes'}
									</button>
									<button
										type="button"
										onClick={() => navigate('/admin/brands')}
										disabled={saving}
										className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 text-sm"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
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
								<h2 className="font-bold text-slate-800">Change Brand Status?</h2>
								<p className="text-sm text-slate-500">
									Change to <strong>{brand.status === true ? 'Inactive' : 'Active'}</strong>
								</p>
							</div>
						</div>

						<p className="text-slate-600 text-sm mb-6">
							{brand.status === true
								? 'This brand will no longer be available for customers.'
								: 'This brand will be available for customers again.'}
						</p>

						<div className="flex gap-3 justify-end">
							<button
								onClick={cancelStatusChange}
								disabled={statusModal.togglingStatus}
								className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={confirmStatusChange}
								disabled={statusModal.togglingStatus}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all"
							>
								{statusModal.togglingStatus ? 'Updating...' : 'Change Status'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
