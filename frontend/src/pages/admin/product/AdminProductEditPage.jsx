import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ChevronLeft, Save, Plus, Trash2, GripVertical, Star, Eye, Package, Clock} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminProductEditPage() {
	const {slug} = useParams();
	const navigate = useNavigate();
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [product, setProduct] = useState(null);

	// Form fields
	const [variantName, setVariantName] = useState('');
	const [summary, setSummary] = useState('');
	const [description, setDescription] = useState('');
	const [importPrice, setImportPrice] = useState('');
	const [basePrice, setBasePrice] = useState('');
	const [salePrice, setSalePrice] = useState('');
	const [stockQuantity, setStockQuantity] = useState('');
	const [warrantyMonths, setWarrantyMonths] = useState('');
	const [status, setStatus] = useState('ACTIVE');
	const [isFeatured, setIsFeatured] = useState(false);
	const [attributes, setAttributes] = useState([]);
	const [imageList, setImageList] = useState([]);
	const [imageFiles, setImageFiles] = useState([]); // File objects mới
	const [imagePreviews, setImagePreviews] = useState([]); // thêm state preview
	const [filterConfig, setFilterConfig] = useState(null);
	const [toast, setToast] = useState(null); // {type: 'success'|'error', message}

	const showToast = (type, message) => {
		setToast({type, message});
		setTimeout(() => {
			setToast(null);
		}, 3000);
		setTimeout(
			() => {
				// navigate(0);
			}, // refresh page để load lại data mới nhất sau khi save thành công
			3000,
		);
	};
	useEffect(() => {
		const fetchProduct = async () => {
			setLoading(true);
			try {
				const res = await api.get(`/public/products/${slug}`);
				const data = res.data;
				setProduct(data);
				setVariantName(data.variantName || '');
				setSummary(data.summary || '');
				setDescription(data.description || '');
				setImportPrice(data.importPrice ?? '');
				setBasePrice(data.basePrice ?? '');
				setSalePrice(data.salePrice ?? '');
				setStockQuantity(data.stockQuantity ?? '');
				setWarrantyMonths(data.warrantyMonths ?? '');
				setStatus(data.status || 'ACTIVE');
				setIsFeatured(data.isFeatured || false);
				setAttributes(data.attributes || []);
				setImageList(data.imageList || []);
			} catch (e) {
				console.error('Error fetching product:', e);
			} finally {
				setLoading(false);
			}
		};
		fetchProduct();
	}, [slug]);
	const handleImageFileChange = (e) => {
		const files = Array.from(e.target.files);
		const newPreviews = files.map((file) => URL.createObjectURL(file));
		setImageFiles((prev) => [...prev, ...files]);
		setImagePreviews((prev) => [...prev, ...newPreviews]);
	};

	const handleRemoveNewImage = (index) => {
		// Revoke URL trước khi xóa
		URL.revokeObjectURL(imagePreviews[index]);
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
		setImagePreviews((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const formData = new FormData();

			formData.append(
				'product',
				new Blob(
					[
						JSON.stringify({
							groupId: product.productGroup?.id,
							variantName,
							slug: product.slug,
							summary, // thêm
							description, // thêm
							importPrice: parseFloat(importPrice) || 0, // thêm, lấy từ product gốc
							basePrice: parseFloat(basePrice) || 0,
							salePrice: parseFloat(salePrice) || 0,
							stockQuantity: parseInt(stockQuantity) || 0,
							warrantyMonths: parseInt(warrantyMonths) || 0, // fix: parseInt
							isFeatured: Boolean(isFeatured), // fix: Boolean
							status,
							attributes,
						}),
					],
					{type: 'application/json'}, // quan trọng: phải set type JSON
				),
			);

			// Nếu không có file thì append file rỗng để tránh lỗi
			if (imageFiles.length > 0) {
				imageFiles.forEach((file) => formData.append('imageFiles', file));
			} else {
				formData.append('imageFiles', new Blob([]), 'empty.jpg');
			}

			await api.put(`/admin/products/${product.id}`, formData, {
				headers: {'Content-Type': 'multipart/form-data'},
			});

			// Refresh lại data
			const res = await api.get(`/public/products/${slug}`);
			const data = res.data;
			setProduct(data);
			setImageList(data.imageList || []);
			setImageFiles([]);
			setImagePreviews([]);

			showToast('success', 'Product updated successfully!');
		} catch (e) {
			console.error('Server error:', e.response?.data);
			alert(`Failed: ${JSON.stringify(e.response?.data)}`);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteImage = async (img) => {
		if (!window.confirm('Delete this image?')) return;
		try {
			await api.delete(`/admin/products/${product.id}/images/${img.id}/delete`);
			setImageList((prev) => prev.filter((i) => i.id !== img.id));
			showToast('success', 'Image deleted!');
		} catch (e) {
			showToast('error', 'Failed to delete image');
		}
	};

	// Set thumbnail
	const handleSetThumbnail = async (img) => {
		console.log('image: ', img);
		try {
			await api.patch(`/admin/products/${product.id}/images/${img.id}/make-thumbnail`);
			// Refresh imageList
			const res = await api.get(`/public/products/${slug}`);
			setImageList(res.data.imageList || []);
			showToast('success', 'Thumbnail updated!');
		} catch (e) {
			showToast('error', 'Failed to set thumbnail');
		}
	};

	const handleAttrChange = (index, field, value) => {
		setAttributes((prev) => prev.map((a, i) => (i === index ? {...a, [field]: value} : a)));
	};

	const handleAddAttr = () => {
		setAttributes((prev) => [...prev, {name: '', attrValue: ''}]);
	};

	const handleRemoveAttr = (index) => {
		setAttributes((prev) => prev.filter((_, i) => i !== index));
	};

	const handleImageUrlChange = (index, value) => {
		setImageList((prev) => prev.map((img, i) => (i === index ? {...img, imageUrl: value} : img)));
	};

	const handleAddImage = () => {
		setImageList((prev) => [...prev, {imageUrl: '', displayOrder: prev.length}]);
	};

	const handleRemoveImage = (index) => {
		setImageList((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({...img, displayOrder: i})));
	};
	// Cleanup tất cả object URLs khi unmount
	useEffect(() => {
		return () => {
			imagePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	}, []);
	const configuredAttrKeys = filterConfig?.attributes?.map((a) => a.key) || [];

	// Attributes KHÔNG có trong config → custom, hiển thị trên
	const customAttributes = attributes.filter((a) => !configuredAttrKeys.includes(a.name));

	// Attributes CÓ trong config → guided
	const configuredAttributes = attributes.filter((a) => configuredAttrKeys.includes(a.name));
	// Fetch filter config theo category slug
	useEffect(() => {
		if (!product?.category?.parentSlug) return;
		const fetchConfig = async () => {
			try {
				const res = await api.get(`/public/categories/${product.category.parentSlug}/filter-config`);
				setFilterConfig(res.data);
			} catch (e) {
				console.error('Error fetching filter config:', e);
			}
		};
		fetchConfig();
	}, [product?.category?.slug]);
	if (loading) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="flex-1 flex items-center justify-center">
						<div className="animate-pulse text-slate-400 text-sm">Loading product...</div>
					</div>
				</main>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="flex-1 flex items-center justify-center">
						<p className="text-slate-500">Product not found.</p>
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
				<div className="p-6 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
					{toast && (
						<div
							className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
								toast.type === 'success'
									? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
									: 'bg-red-50 border border-red-200 text-red-700'
							}`}
						>
							{toast.type === 'success' ? '✓' : '✕'} {toast.message}
						</div>
					)}
					{/* Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-lg transition-all">
								<ChevronLeft size={22} className="text-slate-700" />
							</button>
							<div>
								<h1 className="text-xl font-bold text-slate-800">Edit Product</h1>
								<p className="text-xs text-slate-500 mt-0.5">
									ID: {product.id} • {product.slug}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => navigate(0)}
								disabled={saving}
								className="flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all text-sm"
							>
								<Save size={16} />
								{saving ? 'Saving...' : 'Cancel Changes'}
							</button>
							<button
								onClick={handleSave}
								disabled={saving}
								className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-all text-sm"
							>
								<Save size={16} />
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>

					{/* Stats bar */}
					<div className="grid grid-cols-4 gap-3">
						{[
							{icon: Eye, label: 'View Count', value: product.viewCount || 0},
							{icon: Star, label: 'Avg Rating', value: product.averageRating?.toFixed(1) || 'N/A'},
							{icon: Package, label: 'Stock', value: product.stockQuantity},
							{icon: Clock, label: 'Warranty', value: `${product.warrantyMonths} months`},
						].map(({icon: Icon, label, value}) => (
							<div
								key={label}
								className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3"
							>
								<div className="p-2 bg-blue-50 rounded-lg">
									<Icon size={16} className="text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-slate-500">{label}</p>
									<p className="text-sm font-bold text-slate-800">{value}</p>
								</div>
							</div>
						))}
					</div>

					<div className="grid grid-cols-3 gap-6">
						{/* Left column - main fields */}
						<div className="col-span-2 space-y-5">
							{/* Basic Info */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<h2 className="text-sm font-bold text-slate-700">Basic Information</h2>

								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">Variant Name</label>
									<input
										value={variantName}
										onChange={(e) => setVariantName(e.target.value)}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">Summary</label>
									<input
										value={summary}
										onChange={(e) => setSummary(e.target.value)}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={4}
										className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
									/>
								</div>
							</div>

							{/* Pricing */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<h2 className="text-sm font-bold text-slate-700">Pricing & Stock</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-semibold text-slate-600 mb-1">Import Price (VND)</label>
										<input
											type="number"
											value={importPrice}
											onChange={(e) => setImportPrice(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 mb-1">Stock Quantity</label>
										<input
											type="number"
											value={stockQuantity}
											onChange={(e) => setStockQuantity(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 mb-1">Base Price (VND)</label>
										<input
											type="number"
											value={basePrice}
											onChange={(e) => setBasePrice(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 mb-1">Warranty (months)</label>
										<input
											type="number"
											value={warrantyMonths}
											onChange={(e) => setWarrantyMonths(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-slate-600 mb-1">Sale Price (VND)</label>
										<input
											type="number"
											value={salePrice}
											onChange={(e) => setSalePrice(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
										/>
									</div>
								</div>
							</div>

							{/* Attributes */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-sm font-bold text-slate-700">Attributes</h2>
									<button
										onClick={handleAddAttr}
										className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-all"
									>
										<Plus size={13} /> Add Custom
									</button>
								</div>

								{/* Custom attributes (ngoài config) — hiển thị trên */}
								{customAttributes.map((attr) => {
									const globalIndex = attributes.findIndex((a) => a === attr);
									return (
										<div key={globalIndex} className="grid grid-cols-[120px_1fr_32px] items-center gap-2">
											<input
												value={attr.name}
												onChange={(e) => handleAttrChange(globalIndex, 'name', e.target.value)}
												placeholder="Name"
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

								{/* Divider nếu có cả 2 loại */}
								{customAttributes.length > 0 && filterConfig?.attributes?.length > 0 && (
									<div className="border-t border-slate-100" />
								)}

								{/* Configured attributes (có trong config) — có dropdown options */}
								{filterConfig?.attributes?.length > 0 && (
									<div className="space-y-2">
										<p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">From category config</p>
										{filterConfig.attributes.map((configAttr) => {
											const existingIndex = attributes.findIndex((a) => a.name === configAttr.key);
											const currentValue = existingIndex >= 0 ? attributes[existingIndex].attrValue : '';

											const handleConfigAttrChange = (value) => {
												if (existingIndex >= 0) {
													// Update existing
													handleAttrChange(existingIndex, 'attrValue', value);
												} else {
													// Add new attr từ config
													setAttributes((prev) => [...prev, {name: configAttr.key, attrValue: value}]);
												}
											};

											const handleConfigAttrRemove = () => {
												if (existingIndex >= 0) handleRemoveAttr(existingIndex);
											};

											return (
												<div key={configAttr.key} className="grid grid-cols-[120px_1fr_1fr_32px] items-center gap-2">
													{/* Label cố định */}
													<div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium truncate">
														{configAttr.label}
													</div>

													{/* Dropdown */}
													<select
														value={configAttr.options.includes(currentValue) ? currentValue : ''}
														onChange={(e) => handleConfigAttrChange(e.target.value)}
														className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
													>
														<option value="">— select —</option>
														{configAttr.options.map((opt) => (
															<option key={opt} value={opt}>
																{opt}
															</option>
														))}
													</select>

													{/* Free input */}
													<input
														value={currentValue}
														onChange={(e) => handleConfigAttrChange(e.target.value)}
														placeholder="or type..."
														className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
													/>

													{/* Action */}
													{currentValue ? (
														<button
															onClick={handleConfigAttrRemove}
															className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
															title="Clear"
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

								{attributes.length === 0 && !filterConfig && (
									<p className="text-xs text-slate-400 text-center py-2">No attributes. Click Add to create one.</p>
								)}
							</div>

							{/* Images */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<div className="flex items-center justify-between">
									<h2 className="text-sm font-bold text-slate-700">Images ({imageList.length})</h2>
									<button
										onClick={handleAddImage}
										className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-all"
									>
										<Plus size={13} /> Add
									</button>
								</div>

								{/* Image preview strip */}
								{imageList.length > 0 && (
									<div className="flex gap-3 overflow-x-auto pb-2">
										{imageList.map((img, index) => (
											<div key={img.id ?? index} className="flex flex-col items-center gap-1 flex-shrink-0">
												<div className="relative">
													<img
														src={img.imageUrl.startsWith('http') ? img.imageUrl : `${IMAGE_BASE_URL + img.imageUrl}`}
														alt={`img-${index}`}
														className={`w-16 h-16 object-cover rounded-lg border-2 ${
															img.displayOrder === 0 ? 'border-blue-500' : 'border-slate-200'
														}`}
														onError={(e) => {
															e.target.onerror = null;
															e.target.src = 'https://placehold.co/64x64?text=No+Img';
														}}
													/>
													{img.displayOrder === 0 && (
														<span className="absolute -top-1 -left-1 bg-blue-600 text-white text-[9px] px-1 rounded font-bold">
															Main
														</span>
													)}
												</div>

												{/* Set thumbnail — chỉ hiện với ảnh không phải thumbnail */}
												{img.displayOrder !== 0 && (
													<button
														onClick={() => handleSetThumbnail(img)}
														className="text-[10px] text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
														title="Set as thumbnail"
													>
														★ Main
													</button>
												)}

												{/* Xóa ảnh */}
												<button
													onClick={() => handleDeleteImage(img)}
													className="text-[10px] text-red-500 hover:text-red-700 font-medium"
													title="Delete image"
												>
													Delete
												</button>
											</div>
										))}
									</div>
								)}

								<div className="space-y-2 max-h-60 overflow-y-auto pr-1">
									{imageList.map((img, index) => (
										<div key={index} className="flex items-center gap-2">
											<span className="text-xs text-slate-400 w-5 text-center font-mono">{index}</span>
											<input
												value={img.imageUrl}
												onChange={(e) => handleImageUrlChange(index, e.target.value)}
												placeholder="Image URL"
												className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
											/>
											<button
												onClick={() => handleRemoveImage(index)}
												className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
											>
												<Trash2 size={14} />
											</button>
										</div>
									))}
								</div>
							</div>
							{/* Upload new images */}
							<div className="border-t border-slate-100 pt-3">
								<label className="block text-xs font-semibold text-slate-600 mb-2">Upload New Images</label>
								<label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
									<Plus size={14} className="text-slate-400" />
									<span className="text-xs text-slate-500">Click to select files</span>
									<input type="file" multiple accept="image/*" onChange={handleImageFileChange} className="hidden" />
								</label>

								{imageFiles.length > 0 && (
									<div className="mt-2 space-y-1">
										{imageFiles.map((file, index) => (
											<div key={index} className="flex items-center gap-2">
												<img src={imagePreviews[index]} alt={file.name} className="w-8 h-8 object-cover rounded" />
												<span className="flex-1 text-xs text-slate-600 truncate">{file.name}</span>
												<button
													onClick={() => handleRemoveNewImage(index)}
													className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
												>
													<Trash2 size={12} />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						{/* Right column - meta */}
						<div className="space-y-5">
							{/* Status & Settings */}
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
										<option value="DEACTIVE">Inactive</option>
									</select>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs font-semibold text-slate-600">Featured</p>
										<p className="text-xs text-slate-400">Show in featured sections</p>
									</div>
									<button
										onClick={() => setIsFeatured(!isFeatured)}
										className={`relative w-10 h-5 rounded-full transition-all ${isFeatured ? 'bg-blue-600' : 'bg-slate-200'}`}
									>
										<span
											className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFeatured ? 'left-5' : 'left-0.5'}`}
										/>
									</button>
								</div>
							</div>

							{/* Product Group info (read-only) */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<h2 className="text-sm font-bold text-slate-700">Product Group</h2>
								<div className="space-y-2 text-xs">
									<div className="flex justify-between">
										<span className="text-slate-500">Group</span>
										<span className="font-medium text-slate-700">{product.productGroup?.name}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-500">Group ID</span>
										<span className="font-medium text-slate-700">#{product.productGroup?.id}</span>
									</div>
								</div>
							</div>

							{/* Brand & Category (read-only) */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
								<h2 className="text-sm font-bold text-slate-700">Classification</h2>
								<div className="space-y-3 text-xs">
									<div className="flex items-center gap-2">
										{product.brand?.logoUrl && (
											<img
												src={
													product.brand.logoUrl.startsWith('http') ? product.brand.logoUrl : IMAGE_BASE_URL + product.brand.logoUrl
												}
												alt={product.brand.name}
												className="w-6 h-6 object-contain"
											/>
										)}
										<div>
											<p className="text-slate-500">Brand</p>
											<p className="font-medium text-slate-700">{product.brand?.name}</p>
										</div>
									</div>
									<div>
										<p className="text-slate-500">Category</p>
										<p className="font-medium text-slate-700">{product.category?.name}</p>
										{product.category?.parentSlug && (
											<p className="text-slate-400">
												{product.category.parentSlug} › {product.category.slug}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Timestamps (read-only) */}
							<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-2">
								<h2 className="text-sm font-bold text-slate-700">Timestamps</h2>
								<div className="space-y-1 text-xs">
									<div>
										<p className="text-slate-500">Created</p>
										<p className="font-medium text-slate-700">
											{product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : 'N/A'}
										</p>
									</div>
									<div>
										<p className="text-slate-500">Updated</p>
										<p className="font-medium text-slate-700">
											{product.updatedAt ? new Date(product.updatedAt).toLocaleString('vi-VN') : 'N/A'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
