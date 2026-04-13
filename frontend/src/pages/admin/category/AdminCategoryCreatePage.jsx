import React, {useState, useEffect} from 'react';
import api from '@/services/api';
import {useNavigate} from 'react-router-dom';
import {slugify} from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {ArrowLeft, Check, X, Plus, Trash2} from 'lucide-react';

export default function AdminCategoryCreatePage() {
	const navigate = useNavigate();
	const [existingCategories, setExistingCategories] = useState([]);
	const [mainCategories, setMainCategories] = useState([]);
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const [formData, setFormData] = useState({
		name: '',
		slug: '',
		isMain: true,
		parentId: '',
	});

	const [attributes, setAttributes] = useState([]);
	const [errors, setErrors] = useState({});

	// 1. Lấy dữ liệu danh mục để check unique và làm danh sách cha
	useEffect(() => {
		api.get('/public/categories').then((res) => {
			const list = res.data || [];
			setExistingCategories(list);
			// Chỉ lấy những category là "Main" (parent null) để làm danh sách chọn
			setMainCategories(list.filter((cat) => cat.parent === null));
		});
	}, []);

	// 2. Xử lý khi nhập Tên
	const handleNameChange = (e) => {
		const val = e.target.value;
		const newSlug = slugify(val);
		setFormData({...formData, name: val, slug: newSlug});

		// Check trùng tên ngay lập tức
		const isNameDup = existingCategories.some((c) => c.name.toLowerCase() === val.toLowerCase().trim());
		const isSlugDup = existingCategories.some((c) => c.slug === newSlug);

		setErrors((prev) => ({
			...prev,
			name: isNameDup ? 'Tên danh mục này đã tồn tại!' : '',
			slug: isSlugDup ? 'Slug này đã tồn tại!' : '',
		}));
	};

	// 3. Xử lý khi nhập Slug thủ công
	const handleSlugChange = (e) => {
		const val = e.target.value;
		setFormData({...formData, slug: val});
		const isSlugDup = existingCategories.some((c) => c.slug === val.trim());
		setErrors((prev) => ({...prev, slug: isSlugDup ? 'This slug already exists!' : ''}));
	};

	const handleAttrChange = (index, field, value) => {
		const newAttributes = [...attributes];
		newAttributes[index][field] = value;
		setAttributes(newAttributes);
	};

	const handleOptionChange = (attrIndex, optionIndex, value) => {
		const newAttributes = [...attributes];
		newAttributes[attrIndex].options[optionIndex] = value;
		setAttributes(newAttributes);
	};

	const addOption = (attrIndex) => {
		const newAttributes = [...attributes];
		newAttributes[attrIndex].options.push('');
		setAttributes(newAttributes);
	};

	const removeOption = (attrIndex, optionIndex) => {
		const newAttributes = [...attributes];
		newAttributes[attrIndex].options = newAttributes[attrIndex].options.filter((_, i) => i !== optionIndex);
		setAttributes(newAttributes);
	};

	const addAttribute = () => {
		const newAttr = {key: '', label: '', options: []};
		setAttributes([...attributes, newAttr]);
	};

	const removeAttribute = (index) => {
		setAttributes(attributes.filter((_, i) => i !== index));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		if (!formData.isMain && !formData.parentId) {
			setErrors((prev) => ({...prev, parentId: 'Please select a parent category!'}));
			return;
		}

		if (errors.name || errors.slug) return;

		setLoading(true);

		try {
			const payload = {
				'name': formData.name,
				'slug': formData.slug,
				'parentId': formData.isMain ? null : parseInt(formData.parentId),
			};
			
			const catRes = await api.post('/admin/categories', payload);
			const createdCategory = catRes.data;

			// If main category and has attributes, save them
			if (formData.isMain && attributes.length > 0) {
				const configPayload = {attributes};
				await api.put(`/admin/filter-configs/${createdCategory.slug}`, JSON.stringify(configPayload), {
					headers: {'Content-Type': 'application/json'},
				});
			}

			setSuccessMessage('✅ Category created successfully!');
			navigate('/admin/categories', {state: {showNotification: true, message: 'Category has been created successfully!'}});
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
			} else if (e.message === 'Network Error') {
				errorMsg = 'Unable to connect to server. Please check your connection.';
			} else {
				errorMsg = `An error occurred: ${serverMessage || e.message}`;
			}
			setErrorMessage(errorMsg);
		} finally {
			setLoading(false);
		}
	};

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
							<h1 className="text-2xl font-bold text-slate-800">Create New Category</h1>
							<p className="text-slate-500 text-sm">Add a new product category</p>
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
						<div className="p-8 space-y-5">
							<form onSubmit={handleSave} className="space-y-5">
								{/* Category Name */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">Category Name *</label>
									<input
										type="text"
										required
										value={formData.name}
										onChange={handleNameChange}
										placeholder="e.g., Premium Smartphones"
										className={`w-full px-4 py-2 border rounded-lg outline-none transition-all focus:ring-2 text-sm ${
											errors.name
												? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
												: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
										}`}
									/>
									{errors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name}</p>}
								</div>

								{/* Slug */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">Slug (URL Path)</label>
									<input
										type="text"
										value={formData.slug}
										onChange={handleSlugChange}
										placeholder="Automatically generated"
										className={`w-full px-4 py-2 border rounded-lg outline-none transition-all bg-slate-50 text-sm ${
											errors.slug
												? 'border-red-500 focus:ring-red-500/20'
												: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
										}`}
									/>
									{errors.slug && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.slug}</p>}
								</div>

							{/* Main Category Toggle */}
								<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={formData.isMain}
											onChange={(e) => {
												setFormData({...formData, isMain: e.target.checked, parentId: ''});
												if (!e.target.checked) {
													setAttributes([]);
												}
											}}
											className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
										/>
										<span className="text-sm font-semibold text-slate-700">Main category (no parent)</span>
									</label>
								</div>

								{/* Attributes Section (only for main categories) */}
								{formData.isMain && (
									<div className="border border-slate-200 rounded-lg p-5 bg-blue-50/50 space-y-4">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="font-bold text-slate-800">Filter Attributes</h3>
												<p className="text-xs text-slate-600 mt-0.5">Add filter options like storage, color, RAM, etc.</p>
											</div>
											<button
												type="button"
												onClick={addAttribute}
												className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
											>
												<Plus size={16} />
												Add
											</button>
										</div>

										{/* Attributes List */}
										{attributes.length > 0 ? (
											<div className="space-y-3">
												{attributes.map((attr, index) => (
													<div key={index} className="p-4 border border-slate-200 rounded-lg bg-white space-y-3 group">
														{/* Delete Button */}
														<div className="flex justify-end">
															<button
																type="button"
																onClick={() => removeAttribute(index)}
																className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<Trash2 size={14} />
																Remove
															</button>
														</div>

														{/* Key & Label */}
														<div className="grid grid-cols-2 gap-3">
															<div>
																<label className="block text-xs font-semibold text-slate-700 mb-1">Key *</label>
																<input
																	type="text"
																	value={attr.key}
																	onChange={(e) => handleAttrChange(index, 'key', e.target.value)}
																	placeholder="e.g., Storage"
																	className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																/>
															</div>
															<div>
																<label className="block text-xs font-semibold text-slate-700 mb-1">Display Label *</label>
																<input
																	type="text"
																	value={attr.label}
																	onChange={(e) => handleAttrChange(index, 'label', e.target.value)}
																	placeholder="e.g., Storage Capacity"
																	className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																/>
															</div>
														</div>

														{/* Options */}
														<div>
															<label className="block text-xs font-semibold text-slate-700 mb-2">Options *</label>
															<div className="space-y-2">
																{attr.options.map((opt, optIndex) => (
																	<div key={optIndex} className="flex items-center gap-2">
																		<input
																			type="text"
																			value={opt}
																			onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
																			placeholder={`Option ${optIndex + 1}`}
																			className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																		/>
																		<button
																			type="button"
																			onClick={() => removeOption(index, optIndex)}
																			className="flex-shrink-0 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all"
																			title="Delete option"
																		>
																			<Trash2 size={14} />
																		</button>
																	</div>
																))}
															</div>
															<button
																type="button"
																onClick={() => addOption(index)}
																className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-xs"
															>
																<Plus size={14} />
																Add Option
															</button>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-6 text-slate-500">
												<p className="text-sm">No attributes yet - click "Add" to create one</p>
											</div>
										)}
									</div>
								)}

								{/* Parent Category Selection */}
								{!formData.isMain && (
									<div className="animate-in fade-in slide-in-from-top-2 duration-300">
										<label className="block text-sm font-semibold text-slate-700 mb-2">Parent Category *</label>
										<select
											value={formData.parentId}
											onChange={(e) => {
												setFormData({...formData, parentId: e.target.value});
												setErrors((prev) => ({...prev, parentId: ''}));
											}}
											className={`w-full px-4 py-2 border rounded-lg outline-none transition-all focus:ring-2 text-sm ${
												errors.parentId
													? 'border-red-500 focus:ring-red-500/20'
													: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
											}`}
										>
											<option value="">-- Select a parent category --</option>
											{mainCategories.map((cat) => (
												<option key={cat.id} value={cat.id}>
													{cat.name}
												</option>
											))}
										</select>
										{errors.parentId && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.parentId}</p>}
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3 pt-4 border-t border-slate-100">
									<button
										type="submit"
										disabled={loading}
										className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-all text-sm"
									>
										{loading ? 'Creating...' : 'Create Category'}
									</button>
									<button
										type="button"
										onClick={() => navigate('/admin/categories')}
										disabled={loading}
										className="px-6 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
