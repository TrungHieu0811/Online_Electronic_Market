import React, {useState, useEffect, useRef} from 'react';
import {ArrowLeft, Plus, Trash2, Check, X, GripVertical} from 'lucide-react';
import api from '@/services/api';
import {useNavigate, useParams} from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminCategoryConfigPage() {
	const navigate = useNavigate();
	const {id} = useParams();
	const [category, setCategory] = useState(null);
	const [config, setConfig] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [statusModal, setStatusModal] = useState({isOpen: false, type: 'success', message: ''});

	// Drag state
	const dragIndexRef = useRef(null);
	const [dragOverIndex, setDragOverIndex] = useState(null);
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		loadData();
	}, [id]);

	const loadData = async () => {
		try {
			setLoading(true);
			const catRes = await api.get(`/admin/categories/${id}`);
			setCategory(catRes.data);

			try {
				const configRes = await api.get(`/public/categories/${catRes.data.slug}/filter-config`);
				const data = typeof configRes.data === 'string' ? JSON.parse(configRes.data) : configRes.data;
				// Ensure useFilter exists on all attributes (default true)
				if (data.attributes) {
					data.attributes = data.attributes.map((a) => ({
						useFilter: true,
						...a,
					}));
				}
				setConfig(data);
			} catch {
				setConfig({attributes: []});
			}
		} catch (e) {
			console.error('Error loading data:', e);
			setStatusModal({isOpen: true, type: 'error', message: 'Failed to load category configuration'});
		} finally {
			setLoading(false);
		}
	};

	// ─── Attribute helpers ────────────────────────────────────────────────────

	const handleAttrChange = (index, field, value) => {
		if (!config) return;
		const newAttributes = [...config.attributes];
		newAttributes[index] = {...newAttributes[index], [field]: value};
		setConfig({...config, attributes: newAttributes});
	};

	const handleOptionChange = (attrIndex, optionIndex, value) => {
		if (!config) return;
		const newAttributes = [...config.attributes];
		newAttributes[attrIndex].options[optionIndex] = value;
		setConfig({...config, attributes: newAttributes});
	};

	const addOption = (attrIndex) => {
		if (!config) return;
		const newAttributes = [...config.attributes];
		newAttributes[attrIndex].options.push('');
		setConfig({...config, attributes: newAttributes});
	};

	const removeOption = (attrIndex, optionIndex) => {
		if (!config) return;
		const newAttributes = [...config.attributes];
		newAttributes[attrIndex].options = newAttributes[attrIndex].options.filter((_, i) => i !== optionIndex);
		setConfig({...config, attributes: newAttributes});
	};

	const addAttribute = () => {
		if (!config) return;
		const newAttr = {key: '', label: '', useFilter: true, options: []};
		setConfig({...config, attributes: [...config.attributes, newAttr]});
	};

	const removeAttribute = (index) => {
		if (!config) return;
		setConfig({...config, attributes: config.attributes.filter((_, i) => i !== index)});
	};

	// ─── Drag & Drop ─────────────────────────────────────────────────────────

	const handleDragStart = (e, index) => {
		dragIndexRef.current = index;
		setIsDragging(true);
		e.dataTransfer.effectAllowed = 'move';
		// Transparent ghost
		const ghost = document.createElement('div');
		ghost.style.position = 'absolute';
		ghost.style.top = '-9999px';
		document.body.appendChild(ghost);
		e.dataTransfer.setDragImage(ghost, 0, 0);
		setTimeout(() => document.body.removeChild(ghost), 0);
	};

	const handleDragOver = (e, index) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if (dragIndexRef.current !== index) setDragOverIndex(index);
	};

	const handleDrop = (e, dropIndex) => {
		e.preventDefault();
		const dragIndex = dragIndexRef.current;
		if (dragIndex === null || dragIndex === dropIndex) return;

		const newAttributes = [...config.attributes];
		const [dragged] = newAttributes.splice(dragIndex, 1);
		newAttributes.splice(dropIndex, 0, dragged);
		setConfig({...config, attributes: newAttributes});

		dragIndexRef.current = null;
		setDragOverIndex(null);
		setIsDragging(false);
	};

	const handleDragEnd = () => {
		dragIndexRef.current = null;
		setDragOverIndex(null);
		setIsDragging(false);
	};

	// ─── Save ─────────────────────────────────────────────────────────────────

	const handleSave = async () => {
		if (!config || !category) return;
		setSaving(true);
		try {
			await api.put(`/admin/filter-configs/${category.slug}`, JSON.stringify(config), {
				headers: {'Content-Type': 'application/json'},
			});
			setStatusModal({isOpen: true, type: 'success', message: 'Category configuration saved successfully!'});
			setTimeout(() => setStatusModal((prev) => ({...prev, isOpen: false})), 3500);
		} catch (e) {
			console.error('Error:', e);
			const serverMessage = e.response?.data?.message || e.response?.data || '';
			let errorMsg = '';
			if (e.response?.status === 403) errorMsg = 'Access denied.';
			else if (e.response?.status === 401) errorMsg = 'Session expired. Please log in again.';
			else if (e.response?.status === 400) errorMsg = `Invalid data: ${serverMessage}`;
			else errorMsg = `Error: ${serverMessage || e.message}`;
			setStatusModal({isOpen: true, type: 'error', message: errorMsg});
			setTimeout(() => setStatusModal((prev) => ({...prev, isOpen: false})), 5000);
		} finally {
			setSaving(false);
		}
	};

	// ─── Loading / Not Found ─────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3 text-slate-400">
							<div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
							<span className="text-sm">Loading configuration...</span>
						</div>
					</div>
				</main>
			</div>
		);
	}

	if (!category) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8">
						<p className="text-red-600">Category not found</p>
					</div>
				</main>
			</div>
		);
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
					{/* Page Header */}
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4 flex-1">
							<button
								onClick={() => navigate('/admin/categories')}
								className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900 flex-shrink-0"
								title="Back"
							>
								<ArrowLeft size={20} />
							</button>
							<div className="min-w-0">
								<h1 className="text-2xl font-bold text-slate-800">Configure Category</h1>
								<p className="text-slate-500 text-sm">{category.name} — Manage filter attributes</p>
							</div>
						</div>
						<button
							onClick={handleSave}
							disabled={saving}
							className="flex-shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2.5 rounded-lg transition-all whitespace-nowrap"
						>
							{saving ? 'Saving...' : 'Save Configuration'}
						</button>
					</div>

					{/* Hint */}
					{config && config.attributes.length > 1 && (
						<p className="text-xs text-slate-400 flex items-center gap-1.5">
							<GripVertical size={13} />
							Drag the grip handle to reorder attributes
						</p>
					)}

					{/* Attributes List */}
					<div className="bg-white rounded-xl shadow-sm border border-slate-100">
						<div className="p-6 space-y-3">
							{config && config.attributes.length > 0 ? (
								<div className="space-y-3">
									{config.attributes.map((attr, index) => {
										const isOver = dragOverIndex === index;
										const isBeingDragged = isDragging && dragIndexRef.current === index;

										return (
											<div
												key={index}
												draggable
												onDragStart={(e) => handleDragStart(e, index)}
												onDragOver={(e) => handleDragOver(e, index)}
												onDrop={(e) => handleDrop(e, index)}
												onDragEnd={handleDragEnd}
												className={`
													relative border rounded-xl transition-all duration-150
													${isBeingDragged ? 'opacity-40 scale-[0.99]' : 'opacity-100'}
													${isOver && !isBeingDragged
														? 'border-blue-400 bg-blue-50/60 shadow-md shadow-blue-100'
														: 'border-slate-100 bg-slate-50/40'}
												`}
											>
												{/* Drop indicator line */}
												{isOver && !isBeingDragged && (
													<div className="absolute -top-1.5 left-4 right-4 h-0.5 bg-blue-500 rounded-full" />
												)}

												<div className="p-4 space-y-3">
													{/* Row 1: Grip + Key + Label */}
													<div className="flex items-start gap-2">
														{/* Drag handle */}
														<div
															className="mt-6 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
															title="Drag to reorder"
														>
															<GripVertical size={18} />
														</div>

														<div className="flex-1 grid grid-cols-2 gap-3">
															{/* Attribute Key + useFilter toggle */}
															<div className="space-y-1">
																<label className="block text-xs font-semibold text-slate-700">Attribute Key *</label>
																<input
																	type="text"
																	value={attr.key}
																	onChange={(e) => handleAttrChange(index, 'key', e.target.value)}
																	placeholder="e.g., Storage"
																	className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																/>
																<p className="text-xs text-slate-400">Internal ID</p>

																{/* useFilter toggle */}
																<label className="inline-flex items-center gap-2 mt-1 cursor-pointer select-none group">
																	<div className="relative">
																		<input
																			type="checkbox"
																			className="sr-only peer"
																			checked={!!attr.useFilter}
																			onChange={(e) => handleAttrChange(index, 'useFilter', e.target.checked)}
																		/>
																		<div className="w-8 h-4 bg-slate-200 peer-checked:bg-blue-500 rounded-full transition-colors duration-200" />
																		<div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
																	</div>
																	<span
																		className={`text-xs font-medium transition-colors ${
																			attr.useFilter ? 'text-blue-600' : 'text-slate-400'
																		}`}
																	>
																		{attr.useFilter ? 'Use as filter' : 'Not used as filter'}
																	</span>
																</label>
															</div>

															{/* Display Label */}
															<div>
																<label className="block text-xs font-semibold text-slate-700 mb-1">Display Label *</label>
																<input
																	type="text"
																	value={attr.label}
																	onChange={(e) => handleAttrChange(index, 'label', e.target.value)}
																	placeholder="e.g., Storage Capacity"
																	className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																/>
																<p className="text-xs text-slate-400">Customer label</p>
															</div>
														</div>
													</div>

													{/* Row 2: Options */}
													<div className="pl-6">
														<label className="block text-xs font-semibold text-slate-700 mb-2">Option Values *</label>
														<div className="space-y-1.5">
															{attr.options.map((opt, optIndex) => (
																<div key={optIndex} className="flex items-center gap-2">
																	<input
																		type="text"
																		value={opt}
																		onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
																		placeholder={`e.g., 7" OLED 240hz`}
																		className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
																	/>
																	<button
																		type="button"
																		onClick={() => removeOption(index, optIndex)}
																		className="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
																		title="Delete option"
																	>
																		<Trash2 size={15} />
																	</button>
																</div>
															))}
														</div>
														<button
															type="button"
															onClick={() => addOption(index)}
															className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-xs"
														>
															<Plus size={13} />
															Add Option
														</button>
													</div>

													{/* Row 3: Preview */}
													{attr.options.filter((o) => o.trim()).length > 0 && (
														<div className="pl-6">
															<label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Preview</label>
															<div className="flex flex-wrap gap-1.5">
																{attr.options
																	.filter((o) => o.trim())
																	.map((opt, i) => (
																		<span
																			key={i}
																			className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
																		>
																			{opt}
																		</span>
																	))}
															</div>
														</div>
													)}

													{/* Row 4: Remove button */}
													<div className="pl-6 flex justify-end pt-1">
														<button
															onClick={() => removeAttribute(index)}
															className="flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
														>
															<Trash2 size={14} />
															Remove Attribute
														</button>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-12 text-slate-500">
									<p className="text-sm font-medium">No attributes yet</p>
									<p className="text-xs text-slate-400 mt-1">Click "Add Attribute" to create one</p>
								</div>
							)}

							{/* Add Attribute */}
							<button
								onClick={addAttribute}
								className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold text-sm mt-2"
							>
								<Plus size={17} />
								Add Attribute
							</button>
						</div>
					</div>
				</div>
			</main>

			{/* Status Modal */}
			{statusModal.isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
						<div className="flex items-center gap-4 mb-4">
							<div className={`p-3 rounded-lg ${statusModal.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
								{statusModal.type === 'success' ? (
									<Check className="text-emerald-600" size={28} />
								) : (
									<X className="text-red-600" size={28} />
								)}
							</div>
							<div>
								<h2 className="font-bold text-slate-800">
									{statusModal.type === 'success' ? 'Saved Successfully!' : 'Error Occurred'}
								</h2>
								<p className="text-sm text-slate-600 mt-1">{statusModal.message}</p>
							</div>
						</div>
						<button
							onClick={() => setStatusModal({...statusModal, isOpen: false})}
							className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
						>
							Got it
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
