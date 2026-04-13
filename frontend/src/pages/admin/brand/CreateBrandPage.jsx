import React, {useState, useEffect} from 'react';
import api from '@/services/api';
import {useNavigate} from 'react-router-dom';
import {Upload, X, CheckCircle2, ArrowLeft, Check} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function CreateBrandPage() {
	const navigate = useNavigate();
	const [existingBrands, setExistingBrands] = useState([]);
	const [rootCategories, setRootCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [formData, setFormData] = useState({
		name: '',
		slug: '',
		logoFile: null,
		categoryIds: [], // Lưu danh sách ID category được chọn
	});

	const [preview, setPreview] = useState(null);
	const [errors, setErrors] = useState({name: '', slug: '', logo: '', categories: ''});
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		// Fetch dữ liệu để check unique và hiển thị checkbox
		const fetchData = async () => {
			try {
				const [brandRes, catRes] = await Promise.all([
					api.get('/public/brands'),
					api.get('/public/categories/tree'), // Lấy cate gốc
				]);
				setExistingBrands(brandRes.data || []);
				setRootCategories(catRes.data || []);
			} catch (e) {
				console.error('Lỗi tải dữ liệu:', e);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// Tự động tạo slug và check unique
	const handleNameChange = (e) => {
		const val = e.target.value;
		const generatedSlug = val
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '');
		setFormData({...formData, name: val, slug: generatedSlug});

		const isNameDup = existingBrands.some((b) => b.name.toLowerCase() === val.toLowerCase().trim());
		const isSlugDup = existingBrands.some((b) => b.slug === generatedSlug);

		setErrors((prev) => ({
			...prev,
			name: isNameDup ? 'Brand name already exists!' : '',
			slug: isSlugDup ? 'Slug already exists!' : '',
		}));
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0]; // Lấy file đầu tiên
		if (file) {
			// Kiểm tra định dạng (tùy chọn)
			if (!file.type.startsWith('image/')) {
				setErrors((prev) => ({...prev, logo: 'Please select an image file!'}));
				return;
			}

			setFormData({...formData, logoFile: file});
			setPreview(URL.createObjectURL(file));
			setErrors((prev) => ({...prev, logo: ''})); // Xóa lỗi khi đã chọn ảnh
		}
	};

	const handleCategoryToggle = (id) => {
		const updatedIds = formData.categoryIds.includes(id)
			? formData.categoryIds.filter((itemId) => itemId !== id)
			: [...formData.categoryIds, id];

		setFormData({...formData, categoryIds: updatedIds});

		// Nếu đã chọn ít nhất 1 cái thì xóa tin nhắn lỗi
		if (updatedIds.length > 0) {
			setErrors((prev) => ({...prev, categories: ''}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');
		let tempErrors = {name: '', slug: '', logo: '', categories: ''};
		let hasError = false;
		// 1. Kiểm tra Tên & Slug (nếu đang có lỗi cũ từ handleNameChange)
		if (!formData.name.trim()) {
			tempErrors.name = 'Brand name is required';
			hasError = true;
		}
		if (errors.name || errors.slug) {
			tempErrors.name = errors.name;
			tempErrors.slug = errors.slug;
			hasError = true;
		}

		// 2. Kiểm tra Logo
		if (!formData.logoFile) {
			tempErrors.logo = 'Brand logo is required!';
			hasError = true;
		}

		// 3. Kiểm tra Category (LỖI CỦA BẠN NẰM Ở ĐÂY)
		if (formData.categoryIds.length === 0) {
			tempErrors.categories = 'Please select at least one category!';
			hasError = true;
		}
		setErrors(tempErrors);
		// 2. Kiểm tra các lỗi khác (name, slug trùng)
		if (hasError) {
			window.scrollTo({top: 0, behavior: 'smooth'}); // Cuộn lên để xem lỗi
			return;
		}
		setSaving(true);
		try {
			const brandData = new FormData();
			brandData.append('logoFile', formData.logoFile);
			brandData.append('name', formData.name);
			brandData.append('slug', formData.slug);

			const res = await api.post('/admin/brands', brandData, {
				headers: {'Content-Type': 'multipart/form-data'},
			});

			const newBrandId = res.data.id;

			// 2. Nếu có chọn Category, gọi API link sang bảng trung gian brand_categories
			if (formData.categoryIds.length > 0) {
				// Giả sử bạn có API POST /api/admin/brand-category/{brandId}/categories
				await api.post(`/admin/brand-category/${newBrandId}/categories`, formData.categoryIds);
			}

			setSuccessMessage('✅ Brand created successfully!');
			setTimeout(() => {
				navigate('/admin/brands', {state: {showNotification: true, message: 'Brand has been created successfully!'}});
			}, 1500);
		} catch (err) {
			setErrorMessage('❌ Error: ' + (err.response?.data?.message || 'Failed to create brand'));
		} finally {
			setSaving(false);
		}
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
							<span className="text-sm">Loading...</span>
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

				<div className="p-8 space-y-6">
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
							<h1 className="text-2xl font-bold text-slate-800">Create New Brand</h1>
							<p className="text-slate-500 text-sm">Add a new brand with logo and categories</p>
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
						<div className="p-8 space-y-6">
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Upload Logo */}
								<div
									className={`flex flex-col items-center p-6 border-2 border-dashed rounded-2xl transition-all ${
										errors.logo ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'
									}`}
								>
									{preview ? (
										<div className="relative w-32 h-32">
											<img src={preview} className="w-full h-full object-contain" alt="Preview" />
											<button
												type="button"
												onClick={() => {
													setPreview(null);
													setFormData({...formData, logoFile: null});
												}}
												className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
											>
												<X size={14} />
											</button>
										</div>
									) : (
										<label className="flex flex-col items-center cursor-pointer w-full">
											<Upload className={`${errors.logo ? 'text-red-400' : 'text-slate-400'} mb-2`} size={32} />
											<span className={`text-sm font-medium ${errors.logo ? 'text-red-600' : 'text-slate-600'}`}>
												Click to upload Brand Logo *
											</span>
											<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
										</label>
									)}
								</div>
								{errors.logo && <p className="text-xs text-red-500 mt-2 font-bold text-center">{errors.logo}</p>}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Brand Name *</label>
										<input
											type="text"
											value={formData.name}
											onChange={handleNameChange}
											className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all focus:ring-2 ${
												errors.name
													? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
													: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
											}`}
											placeholder="e.g., Samsung"
											required
										/>
										{errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name}</p>}
									</div>
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Slug</label>
										<input
											type="text"
											value={formData.slug}
											onChange={(e) => setFormData({...formData, slug: e.target.value})}
											className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 outline-none transition-all focus:ring-2 ${
												errors.slug
													? 'border-red-500 focus:ring-red-500/20'
													: 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
											}`}
										/>
										{errors.slug && <p className="text-xs text-red-600 mt-1 font-medium">{errors.slug}</p>}
									</div>
								</div>

								{/* Checkboxes Category */}
								<div>
									<label className={`block text-sm font-semibold mb-3 ${errors.categories ? 'text-red-600' : 'text-slate-700'}`}>
										Categories (Select at least 1) *
									</label>
									<div
										className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg transition-all ${
											errors.categories ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
										}`}
									>
										{rootCategories.map((cat) => (
											<label
												key={cat.id}
												className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
													formData.categoryIds.includes(cat.id)
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 hover:bg-slate-100'
												}`}
											>
												<input
													type="checkbox"
													className="w-4 h-4 rounded"
													checked={formData.categoryIds.includes(cat.id)}
													onChange={() => handleCategoryToggle(cat.id)}
												/>
												<span className="text-sm font-medium">{cat.name}</span>
											</label>
										))}
									</div>
									{/* Thông báo lỗi đỏ */}
									{errors.categories && (
										<p className="text-xs text-red-600 mt-2 font-bold flex items-center gap-1">
											<span className="text-lg">⚠️</span> {errors.categories}
										</p>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 pt-6 border-t border-slate-100">
									<button
										type="submit"
										disabled={saving}
										className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
									>
										{saving ? 'Creating...' : 'Create Brand'}
									</button>
									<button
										type="button"
										onClick={() => navigate('/admin/brands')}
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
		</div>
	);
}
