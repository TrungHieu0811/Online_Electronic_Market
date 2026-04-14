import React, {useEffect, useState, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ChevronLeft, Save, Plus, Trash2, AlertCircle, Check, Loader2} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const slugify = (text) =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');

function useDebounce(value, delay) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

export default function AdminProductCreatePage() {
	const {groupId} = useParams();
	const navigate = useNavigate();

	// ── Group data ────────────────────────────────────────────────────────────
	const [group, setGroup] = useState(null);
	const [filterConfig, setFilterConfig] = useState(null);
	const [loadingGroup, setLoadingGroup] = useState(true);

	// ── Form fields ───────────────────────────────────────────────────────────
	const [variantSuffix, setVariantSuffix] = useState('');
	const [variantName, setVariantName] = useState('');
	const [slug, setSlug] = useState('');
	const [summary, setSummary] = useState('');
	const [description, setDescription] = useState('');
	const [importPrice, setImportPrice] = useState('');
	const [basePrice, setBasePrice] = useState('');
	const [salePrice, setSalePrice] = useState('');
	const [stockQuantity, setStockQuantity] = useState('');
	const [warrantyMonths, setWarrantyMonths] = useState('');
	const [isFeatured, setIsFeatured] = useState(false);
	const [status, setStatus] = useState('ACTIVE');
	const [attributes, setAttributes] = useState([]);
	const [imageFiles, setImageFiles] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);

	// ── Name uniqueness check ─────────────────────────────────────────────────
	const [nameStatus, setNameStatus] = useState('idle'); // idle | checking | available | taken
	const debouncedVariantName = useDebounce(variantName, 600);

	// ── UI state ──────────────────────────────────────────────────────────────
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState(null);
	const fileInputRef = useRef(null);

	// ── Load group + filter config ────────────────────────────────────────────
	useEffect(() => {
		if (!groupId) return;
		const fetchGroup = async () => {
			setLoadingGroup(true);
			try {
				const res = await api.get(`/admin/product-group/${groupId}`);
				const g = res.data;
				setGroup(g);
				setVariantName(g.name || '');
				setSlug(slugify(g.name || ''));

				const rootSlug = g.category?.parent?.name || g.category?.slug;
				if (rootSlug) {
					try {
						const configRes = await api.get(`/public/categories/${rootSlug}/filter-config`);
						const config = configRes.data;
						setFilterConfig(config);
						if (config?.attributes?.length) {
							setAttributes(
								config.attributes.map((a) => ({
									name: a.key,
									label: a.label,
									attrValue: '',
									options: a.options || [],
									fromConfig: true,
								})),
							);
						}
					} catch {
						// no config for this category — fine
					}
				}
			} catch (e) {
				console.error('Error fetching group:', e);
				showToast('error', 'Failed to load product group');
			} finally {
				setLoadingGroup(false);
			}
		};
		fetchGroup();
	}, [groupId]);

	// ── Build variantName ─────────────────────────────────────────────────────
	useEffect(() => {
		if (!group) return;
		const combined = variantSuffix.trim() ? `${group.name} ${variantSuffix.trim()}` : group.name;
		setVariantName(combined);
		setSlug(slugify(combined));
	}, [variantSuffix, group]);

	// ── Check name uniqueness via API ─────────────────────────────────────────
	useEffect(() => {
		if (!debouncedVariantName || !group) {
			setNameStatus('idle');
			return;
		}
		let cancelled = false;
		setNameStatus('checking');
		const check = async () => {
			try {
				const res = await api.get('/public/products', {
					params: {keyword: debouncedVariantName, size: 5},
				});
				if (cancelled) return;
				const content = res.data?.content || [];
				const taken = content.some(
					(p) => p.variantName?.toLowerCase().trim() === debouncedVariantName.toLowerCase().trim(),
				);
				setNameStatus(taken ? 'taken' : 'available');
			} catch {
				if (!cancelled) setNameStatus('idle');
			}
		};
		check();
		return () => {
			cancelled = true;
		};
	}, [debouncedVariantName]);

	// ── Toast ─────────────────────────────────────────────────────────────────
	const showToast = (type, message) => {
		setToast({type, message});
		setTimeout(() => setToast(null), 3500);
	};

	// ── Images ────────────────────────────────────────────────────────────────
	const handleImageFileChange = (e) => {
		const files = Array.from(e.target.files);
		const previews = files.map((f) => URL.createObjectURL(f));
		setImageFiles((prev) => [...prev, ...files]);
		setImagePreviews((prev) => [...prev, ...previews]);
		e.target.value = '';
	};

	const handleRemoveImage = (index) => {
		URL.revokeObjectURL(imagePreviews[index]);
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
		setImagePreviews((prev) => prev.filter((_, i) => i !== index));
	};

	useEffect(() => {
		return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
	}, []);

	// ── Attributes ────────────────────────────────────────────────────────────
	const handleAttrChange = (index, field, value) => {
		setAttributes((prev) => prev.map((a, i) => (i === index ? {...a, [field]: value} : a)));
	};

	const handleAddCustomAttr = () => {
		setAttributes((prev) => [...prev, {name: '', label: '', attrValue: '', options: [], fromConfig: false}]);
	};

	const handleRemoveAttr = (index) => {
		setAttributes((prev) => prev.filter((_, i) => i !== index));
	};

	const configuredAttrs = attributes.filter((a) => a.fromConfig);
	const customAttrs = attributes.filter((a) => !a.fromConfig);

	// ── Validation ────────────────────────────────────────────────────────────
	const validate = () => {
		const e = {};
		if (!variantSuffix.trim()) e.variantSuffix = 'Variant suffix is required';
		if (nameStatus === 'taken') e.variantSuffix = 'This variant name already exists';
		if (!summary.trim()) e.summary = 'Summary is required';
		if (!description.trim()) e.description = 'Description is required';
		if (!importPrice || isNaN(importPrice) || Number(importPrice) < 0) e.importPrice = 'Required';
		if (!basePrice || isNaN(basePrice) || Number(basePrice) < 0) e.basePrice = 'Required';
		if (!salePrice || isNaN(salePrice) || Number(salePrice) < 0) e.salePrice = 'Required';
		if (!stockQuantity || isNaN(stockQuantity) || Number(stockQuantity) < 0) e.stockQuantity = 'Required';
		if (!warrantyMonths || isNaN(warrantyMonths)) e.warrantyMonths = 'Required';
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	// ── Submit ────────────────────────────────────────────────────────────────
	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const formData = new FormData();
			formData.append(
				'product',
				new Blob(
					[
						JSON.stringify({
							groupId: Number(groupId),
							variantName,
							slug,
							summary,
							description,
							importPrice: parseFloat(importPrice),
							basePrice: parseFloat(basePrice),
							salePrice: parseFloat(salePrice),
							stockQuantity: parseInt(stockQuantity),
							warrantyMonths: parseInt(warrantyMonths),
							isFeatured,
							status,
							attributes: attributes.filter((a) => a.attrValue).map((a) => ({name: a.name, attrValue: a.attrValue})),
						}),
					],
					{type: 'application/json'},
				),
			);

			if (imageFiles.length > 0) {
				imageFiles.forEach((file) => formData.append('imageFiles', file));
			} else {
				formData.append('imageFiles', new Blob([]), 'empty.jpg');
			}

			await api.post('/admin/products', formData, {
				headers: {'Content-Type': 'multipart/form-data'},
			});

			navigate(`/admin/products/groups/${groupId}`, {
				state: {showNotification: true, message: `Product "${variantName}" created successfully!`},
			});
		} catch (e) {
			console.error('Error creating product:', e);
			showToast('error', e.response?.data?.message || 'Failed to create product');
		} finally {
			setSaving(false);
		}
	};

	// ── Loading / not found ───────────────────────────────────────────────────
	if (loadingGroup) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="flex items-center justify-center flex-1">
						<div className="flex flex-col items-center gap-3 text-slate-400">
							<div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
							<span className="text-sm">Loading product group...</span>
						</div>
					</div>
				</main>
			</div>
		);
	}

	if (!group) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="p-8">
						<p className="text-red-500">Product group not found.</p>
					</div>
				</main>
			</div>
		);
	}

	const discountPct =
		basePrice && salePrice && Number(salePrice) < Number(basePrice)
			? Math.round((1 - Number(salePrice) / Number(basePrice)) * 100)
			: null;

	const canSubmit = !saving && nameStatus !== 'taken' && nameStatus !== 'checking';

	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-6 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
					{/* Toast */}
					{toast && (
						<div
							className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
								toast.type === 'success'
									? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
									: 'bg-red-50 border border-red-200 text-red-700'
							}`}
						>
							{toast.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
							{toast.message}
						</div>
					)}

					{/* Page Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								onClick={() => navigate(`/admin/products/groups/${groupId}`)}
								className="p-2 hover:bg-slate-200 rounded-lg transition-all"
							>
								<ChevronLeft size={22} className="text-slate-700" />
							</button>
							<div>
								<h1 className="text-xl font-bold text-slate-800">Add New Variant</h1>
								<p className="text-xs text-slate-500 mt-0.5">
									{group.name} · {group.brand?.name} · {group.category?.name}
								</p>
							</div>
						</div>
						<button
							onClick={handleSave}
							disabled={!canSubmit}
							className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all text-sm"
						>
							{saving ? (
								<>
									<Loader2 size={16} className="animate-spin" /> Saving...
								</>
							) : (
								<>
									<Save size={16} /> Create Product
								</>
							)}
						</button>
					</div>

					<div className="grid grid-cols-3 gap-6">
						{/* ── LEFT (2/3) ── */}
						<div className="col-span-2 space-y-5">
							{/* Variant identity */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<h2 className="text-sm font-bold text-slate-700">Variant Identity</h2>

								{/* Suffix input */}
								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Variant Suffix <span className="text-red-500">*</span>
									</label>
									<div
										className={`flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all ${
											errors.variantSuffix ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-500'
										}`}
									>
										<span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-200 whitespace-nowrap flex-shrink-0 select-none">
											{group.name} /
										</span>
										<input
											type="text"
											value={variantSuffix}
											onChange={(e) => {
												setVariantSuffix(e.target.value);
												setErrors((prev) => ({...prev, variantSuffix: undefined}));
											}}
											placeholder="256GB Black"
											className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
										/>
									</div>
									{errors.variantSuffix && (
										<p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
											<AlertCircle size={12} /> {errors.variantSuffix}
										</p>
									)}
								</div>

								{/* Variant name preview + uniqueness status */}
								<div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-1.5">
									<p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Variant Name</p>
									<p className="text-sm font-semibold text-slate-800">{variantName}</p>
									{nameStatus === 'checking' && (
										<p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
											<Loader2 size={11} className="animate-spin" /> Checking availability...
										</p>
									)}
									{nameStatus === 'available' && (
										<p className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
											<Check size={12} /> Name is available
										</p>
									)}
									{nameStatus === 'taken' && (
										<p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
											<AlertCircle size={12} /> This name already exists
										</p>
									)}
								</div>

								{/* Slug */}
								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">Slug (auto-generated)</label>
									<div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 break-all">
										{slug || '—'}
									</div>
								</div>

								{/* Summary */}
								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Summary <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={summary}
										onChange={(e) => {
											setSummary(e.target.value);
											setErrors((prev) => ({...prev, summary: undefined}));
										}}
										placeholder="Short one-line description for listings"
										className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											errors.summary ? 'border-red-300 bg-red-50' : 'border-slate-200'
										}`}
									/>
									{errors.summary && (
										<p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
											<AlertCircle size={12} /> {errors.summary}
										</p>
									)}
								</div>

								{/* Description */}
								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Description <span className="text-red-500">*</span>
									</label>
									<textarea
										value={description}
										onChange={(e) => {
											setDescription(e.target.value);
											setErrors((prev) => ({...prev, description: undefined}));
										}}
										rows={4}
										placeholder="Full product description..."
										className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none ${
											errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
										}`}
									/>
									{errors.description && (
										<p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
											<AlertCircle size={12} /> {errors.description}
										</p>
									)}
								</div>
							</div>

							{/* Pricing & Stock */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<h2 className="text-sm font-bold text-slate-700">Pricing & Stock</h2>
								<div className="grid grid-cols-2 gap-4">
									{[
										{label: 'Import Price (VND)', key: 'importPrice', val: importPrice, set: setImportPrice},
										{label: 'Stock Quantity', key: 'stockQuantity', val: stockQuantity, set: setStockQuantity},
										{label: 'Base Price (VND)', key: 'basePrice', val: basePrice, set: setBasePrice},
										{label: 'Warranty (months)', key: 'warrantyMonths', val: warrantyMonths, set: setWarrantyMonths},
										{label: 'Sale Price (VND)', key: 'salePrice', val: salePrice, set: setSalePrice},
									].map(({label, key, val, set}) => (
										<div key={key}>
											<label className="block text-xs font-semibold text-slate-600 mb-1">
												{label} <span className="text-red-500">*</span>
											</label>
											<input
												type="number"
												value={val}
												onChange={(e) => {
													set(e.target.value);
													setErrors((prev) => ({...prev, [key]: undefined}));
												}}
												placeholder="0"
												min="0"
												className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
													errors[key] ? 'border-red-300 bg-red-50' : 'border-slate-200'
												}`}
											/>
											{errors[key] && <p className="text-xs text-red-600 font-medium mt-1">{errors[key]}</p>}
										</div>
									))}
								</div>

								{discountPct !== null && (
									<div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
										<Check size={13} />
										{discountPct}% discount applied off base price
									</div>
								)}
							</div>

							{/* Attributes */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-sm font-bold text-slate-700">Attributes</h2>
									<button
										onClick={handleAddCustomAttr}
										className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-all"
									>
										<Plus size={13} /> Add Custom
									</button>
								</div>

								{/* Custom attributes */}
								{customAttrs.map((attr) => {
									const globalIndex = attributes.findIndex((a) => a === attr);
									return (
										<div key={globalIndex} className="grid grid-cols-[140px_1fr_32px] items-center gap-2">
											<input
												value={attr.name}
												onChange={(e) => handleAttrChange(globalIndex, 'name', e.target.value)}
												placeholder="Attribute key"
												className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
											/>
											<input
												value={attr.attrValue}
												onChange={(e) => handleAttrChange(globalIndex, 'attrValue', e.target.value)}
												placeholder="Value"
												className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
											/>
											<button
												onClick={() => handleRemoveAttr(globalIndex)}
												className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
											>
												<Trash2 size={14} />
											</button>
										</div>
									);
								})}

								{/* Divider */}
								{customAttrs.length > 0 && configuredAttrs.length > 0 && <div className="border-t border-slate-100" />}

								{/* Config-driven attributes */}
								{configuredAttrs.length > 0 && (
									<div className="space-y-2">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
											From category config · {group.category?.parentSlug || group.category?.slug}
										</p>
										{configuredAttrs.map((attr) => {
											const globalIndex = attributes.findIndex((a) => a === attr);
											return (
												<div key={globalIndex} className="grid grid-cols-[140px_1fr_1fr_32px] items-center gap-2">
													<div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium truncate">
														{attr.label}
													</div>
													{attr.options.length > 0 ? (
														<select
															value={attr.options.includes(attr.attrValue) ? attr.attrValue : ''}
															onChange={(e) => handleAttrChange(globalIndex, 'attrValue', e.target.value)}
															className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
														>
															<option value="">— select —</option>
															{attr.options.map((opt) => (
																<option key={opt} value={opt}>
																	{opt}
																</option>
															))}
														</select>
													) : (
														<div />
													)}
													<input
														value={attr.attrValue}
														onChange={(e) => handleAttrChange(globalIndex, 'attrValue', e.target.value)}
														placeholder="or type a value..."
														className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
													/>
													{attr.attrValue ? (
														<button
															onClick={() => handleAttrChange(globalIndex, 'attrValue', '')}
															className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
															title="Clear value"
														>
															<Trash2 size={14} />
														</button>
													) : (
														<div className="flex items-center justify-center">
															<span className="w-2 h-2 rounded-full bg-slate-200" />
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}

								{attributes.length === 0 && (
									<p className="text-xs text-slate-400 text-center py-2">No attributes. Click "Add Custom" to add one.</p>
								)}
							</div>

							{/* Image upload */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<h2 className="text-sm font-bold text-slate-700">
									Product Images {imageFiles.length > 0 && `(${imageFiles.length})`}
								</h2>

								{imagePreviews.length > 0 && (
									<div className="flex gap-3 overflow-x-auto pb-2">
										{imagePreviews.map((url, index) => (
											<div key={index} className="flex flex-col items-center gap-1 flex-shrink-0">
												<div className="relative">
													<img
														src={url}
														alt={`preview-${index}`}
														className={`w-16 h-16 object-cover rounded-lg border-2 ${
															index === 0 ? 'border-blue-500' : 'border-slate-200'
														}`}
													/>
													{index === 0 && (
														<span className="absolute -top-1 -left-1 bg-blue-600 text-white text-[9px] px-1 rounded font-bold">
															Cover
														</span>
													)}
												</div>
												<button
													onClick={() => handleRemoveImage(index)}
													className="text-[10px] text-red-500 hover:text-red-700 font-medium"
												>
													Remove
												</button>
											</div>
										))}
									</div>
								)}

								<label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
									<Plus size={14} className="text-slate-400" />
									<span className="text-xs text-slate-500">Click to select image files</span>
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept="image/*"
										onChange={handleImageFileChange}
										className="hidden"
									/>
								</label>
								{imagePreviews.length > 0 && (
									<p className="text-[11px] text-slate-400">First image will be used as the cover / thumbnail</p>
								)}
							</div>
						</div>

						{/* ── RIGHT (1/3) ── */}
						<div className="space-y-5">
							{/* Group info (read-only) */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<h2 className="text-sm font-bold text-slate-700">Product Group</h2>
								<div className="space-y-2 text-xs">
									<div className="flex justify-between gap-2">
										<span className="text-slate-500 flex-shrink-0">Group</span>
										<span className="font-semibold text-slate-700 text-right">{group.name}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-500">Group ID</span>
										<span className="font-semibold text-slate-700">#{groupId}</span>
									</div>
								</div>
							</div>

							{/* Classification (read-only) */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<h2 className="text-sm font-bold text-slate-700">Classification</h2>
								<div className="space-y-3 text-xs">
									<div className="flex items-center gap-2">
										{group.brand?.logoUrl && (
											<img src={group.brand.logoUrl} alt={group.brand.name} className="w-6 h-6 object-contain" />
										)}
										<div>
											<p className="text-slate-500">Brand</p>
											<p className="font-semibold text-slate-700">{group.brand?.name || '—'}</p>
										</div>
									</div>
									<div>
										<p className="text-slate-500">Category</p>
										<p className="font-semibold text-slate-700">{group.category?.name || '—'}</p>
										{group.category?.parent?.name && (
											<p className="text-slate-400 mt-0.5">
												{group.category.parent?.name} › {group.category.slug}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Settings */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<h2 className="text-sm font-bold text-slate-700">Settings</h2>

								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
									<select
										value={status}
										onChange={(e) => setStatus(e.target.value)}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
									>
										<option value="ACTIVE">Active</option>
										<option value="INACTIVE">Inactive</option>
										<option value="OUT_OF_STOCK">Out of Stock</option>
									</select>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs font-semibold text-slate-600">Featured</p>
										<p className="text-xs text-slate-400">Show in featured sections</p>
									</div>
									<button
										type="button"
										onClick={() => setIsFeatured(!isFeatured)}
										className={`relative w-10 h-5 rounded-full transition-all ${isFeatured ? 'bg-blue-600' : 'bg-slate-200'}`}
									>
										<span
											className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFeatured ? 'left-5' : 'left-0.5'}`}
										/>
									</button>
								</div>
							</div>

							{/* Submit button */}
							<button
								onClick={handleSave}
								disabled={!canSubmit}
								className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm"
							>
								{saving ? (
									<>
										<Loader2 size={15} className="animate-spin" /> Creating...
									</>
								) : (
									<>
										<Save size={15} /> Create Product
									</>
								)}
							</button>

							{nameStatus === 'taken' && (
								<p className="text-xs text-red-600 font-medium text-center">Fix the variant name conflict first</p>
							)}
							{nameStatus === 'checking' && (
								<p className="text-xs text-amber-600 font-medium text-center">Waiting for name check...</p>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
