import React, {useState, useEffect} from 'react';
import api from '@/services/api';
import {useNavigate, useParams} from 'react-router-dom';
import {slugify} from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {ArrowLeft, Check, X, Lock, AlertCircle} from 'lucide-react';

export default function AdminCategoryEditPage() {
	const navigate = useNavigate();
	const {id} = useParams();
	const [existingCategories, setExistingCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [togglingStatus, setTogglingStatus] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [statusModal, setStatusModal] = useState({isOpen: false, currentStatus: null});

	const [formData, setFormData] = useState({
		name: '',
		slug: '',
		parentId: null,
		parentName: '',
		status: true,
	});

	const [errors, setErrors] = useState({});

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				const catRes = await api.get(`/admin/categories/${id}`);
				const category = catRes.data;

				setFormData({
					name: category.name,
					slug: category.slug,
					parentId: category.parent?.id || null,
					parentName: category.parent?.name || '',
					status: category.status ?? true,
				});

				const allRes = await api.get('/public/categories');
				setExistingCategories(allRes.data || []);
			} catch (e) {
				console.error('Error loading category:', e);
				setErrorMessage('Failed to load category. Please refresh the page.');
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [id]);

	const handleNameChange = (e) => {
		const val = e.target.value;
		const newSlug = slugify(val);
		setFormData({...formData, name: val, slug: newSlug});

		const isNameDup = existingCategories.some(
			(c) => c.id !== parseInt(id) && c.name.toLowerCase() === val.toLowerCase().trim(),
		);
		const isSlugDup = existingCategories.some((c) => c.id !== parseInt(id) && c.slug === newSlug);

		setErrors((prev) => ({
			...prev,
			name: isNameDup ? 'This category name already exists!' : '',
			slug: isSlugDup ? 'This slug already exists!' : '',
		}));
	};

	const handleSlugChange = (e) => {
		const val = e.target.value;
		setFormData({...formData, slug: val});
		const isSlugDup = existingCategories.some((c) => c.id !== parseInt(id) && c.slug === val.trim());
		setErrors((prev) => ({...prev, slug: isSlugDup ? 'This slug already exists!' : ''}));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		if (errors.name || errors.slug) return;

		setSaving(true);

		try {
			const payload = {
				name: formData.name,
				slug: formData.slug,
				parentId: formData.parentId ? parseInt(formData.parentId) : null,
			};

			await api.put(`/admin/categories/${id}`, payload);
			setSuccessMessage('✅ Category updated successfully!');

			setTimeout(() => {
				navigate('/admin/categories', {
					state: {showNotification: true, message: 'Category has been updated successfully!'},
				});
			}, 1500);
		} catch (e) {
			console.error('Full Error Object:', e);

			const serverMessage = e.response?.data?.error || e.response?.data?.message || e.response?.data || '';

			let errorMsg = '';
			if (e.response?.status === 403) {
				errorMsg = 'Access denied. You do not have permission to perform this action.';
			} else if (e.response?.status === 401) {
				errorMsg = 'Session expired or invalid token. Please log in again.';
			} else if (e.response?.status === 400) {
				errorMsg = `Invalid data: ${serverMessage}`;
			} else if (e.response?.status === 404) {
				errorMsg = 'Category not found.';
			} else if (e.message === 'Network Error') {
				errorMsg = 'Unable to connect to server. Please check your connection.';
			} else {
				errorMsg = `An error occurred: ${serverMessage || e.message}`;
			}
			setErrorMessage(errorMsg);
		} finally {
			setSaving(false);
		}
	};

	const handleStatusChangeClick = () => {
		setStatusModal({isOpen: true, currentStatus: formData.status});
	};

	const confirmStatusChange = async () => {
		setTogglingStatus(true);
		try {
			const res = await api.put(`/admin/categories/changestatus/${id}`);
			if (res.status === 204) {
				setFormData({...formData, status: !formData.status});
			}
			setStatusModal({isOpen: false, currentStatus: null});
			setSuccessMessage('✅ Category status updated successfully!');
			setTimeout(() => setSuccessMessage(''), 5000);
		} catch (err) {
			setErrorMessage(err.response?.data?.message || 'Failed to update category status');
			setTimeout(() => setErrorMessage(''), 5000);
		} finally {
			setTogglingStatus(false);
		}
	};

	const cancelStatusChange = () => {
		setStatusModal({isOpen: false, currentStatus: null});
	};

	const getStatusColor = (status) => {
		return status === true ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';
	};

	const getStatusLabel = (status) => {
		return status === true ? 'Active' : 'Inactive';
	};

	if (loading) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3 text-slate-400">
							<div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
							<span className="text-sm">Loading category...</span>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
					{/* Page Header */}
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/admin/categories')}
							className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
							title="Back"
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Edit Category</h1>
							<p className="text-slate-500 text-sm">Update category details</p>
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

					{/* Form & Status Card */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
						{/* Tab Bar */}
						<div className="flex border-b border-slate-100">
							<div className="flex-1 px-6 py-4 bg-slate-50 flex justify-center items-center border-b-2 border-blue-600 ">
								<span className="font-semibold text-slate-800">Details</span>
							</div>
							<button
								onClick={handleStatusChangeClick}
								className="flex-1 px-6 py-4 bg-white hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-semibold border-l border-slate-100 flex items-center justify-center gap-2"
								type="button"
							>
								<div className="">
									<p className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(formData.status)}`}>
										{getStatusLabel(formData.status)}
									</p>
									<p className="text-xs font-light">Change Status</p>
								</div>
							</button>
						</div>

						<div className="p-8 space-y-6">
							<form onSubmit={handleSave} className="space-y-6">
								{/* Category Name */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">Category Name *</label>
									<input
										type="text"
										required
										value={formData.name}
										onChange={handleNameChange}
										placeholder="e.g., Premium Smartphones"
										className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all focus:ring-2 ${
											errors.name
												? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
												: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
										}`}
									/>
									{errors.name && <p className="mt-2 text-xs text-red-600 font-medium">{errors.name}</p>}
								</div>

								{/* Slug */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">Slug (URL Path)</label>
									<input
										type="text"
										value={formData.slug}
										onChange={handleSlugChange}
										placeholder="Automatically generated"
										className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all bg-slate-50 ${
											errors.slug
												? 'border-red-500 focus:ring-red-500/20'
												: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
										}`}
									/>
									{errors.slug && <p className="mt-2 text-xs text-red-600 font-medium">{errors.slug}</p>}
								</div>

								{/* Parent Category (Read-only) */}
								{formData.parentId && (
									<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
										<label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
											<Lock size={16} className="text-slate-400" />
											Parent Category
										</label>
										<div className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
											{formData.parentName || 'N/A'}
										</div>
										<p className="text-xs text-slate-500 mt-2">Parent category cannot be changed</p>
									</div>
								)}

								{!formData.parentId && (
									<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
										<label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
											<Lock size={16} className="text-slate-400" />
											Category Type
										</label>
										<div className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
											Main Category
										</div>
										<p className="text-xs text-slate-500 mt-2">This is a main category (no parent)</p>
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3 pt-6 border-t border-slate-100">
									<button
										type="submit"
										disabled={saving}
										className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
									>
										{saving ? 'Updating...' : 'Update Category'}
									</button>
									<button
										type="button"
										onClick={() => navigate('/admin/categories')}
										disabled={saving}
										className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
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
