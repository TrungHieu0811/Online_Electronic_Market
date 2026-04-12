import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, Check, X, AlertCircle, ChevronRight, Loader2, Tag, Layers, Bookmark, Search} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({num, label, state}) {
	return (
		<div className="flex items-center gap-2">
			<div
				className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
					state === 'done'
						? 'bg-emerald-500 text-white'
						: state === 'active'
							? 'bg-blue-600 text-white ring-4 ring-blue-100'
							: 'bg-slate-100 text-slate-400'
				}`}
			>
				{state === 'done' ? <Check size={13} /> : num}
			</div>
			<span
				className={`text-xs font-semibold whitespace-nowrap transition-colors ${
					state === 'active' ? 'text-blue-700' : state === 'done' ? 'text-emerald-600' : 'text-slate-400'
				}`}
			>
				{label}
			</span>
		</div>
	);
}

// ─── Option card ──────────────────────────────────────────────────────────────
function OptionCard({label, sublabel, selected, onClick, disabled}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150 group ${
				selected
					? 'border-blue-500 bg-blue-50 shadow-sm'
					: disabled
						? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
						: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<p className={`text-sm font-semibold truncate ${selected ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
					{sublabel && <p className="text-xs text-slate-400 mt-0.5 truncate">{sublabel}</p>}
				</div>
				{selected && <Check size={15} className="text-blue-600 flex-shrink-0" />}
			</div>
		</button>
	);
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({icon: Icon, title, subtitle, children, locked}) {
	return (
		<div
			className={`bg-white rounded-xl border transition-all duration-200 ${locked ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'}`}
		>
			<div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
				<div className={`p-2 rounded-lg ${locked ? 'bg-slate-100' : 'bg-blue-50'}`}>
					<Icon size={16} className={locked ? 'text-slate-400' : 'text-blue-600'} />
				</div>
				<div>
					<p className="text-sm font-bold text-slate-800">{title}</p>
					{subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
				</div>
				{locked && (
					<span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
						Complete previous step
					</span>
				)}
			</div>
			<div className="p-5">{children}</div>
		</div>
	);
}

// ─── Highlight matching substring ─────────────────────────────────────────────
function HighlightMatch({text, query}) {
	if (!query.trim()) return <span>{text}</span>;
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escaped})`, 'gi');
	const parts = text.split(regex);
	return (
		<span>
			{parts.map((part, i) =>
				part.toLowerCase() === query.toLowerCase() ? (
					<mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5 not-italic font-bold">
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</span>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminProductGroupCreatePage() {
	const navigate = useNavigate();

	// Raw data
	const [rootCategories, setRootCategories] = useState([]);
	const [childCategories, setChildCategories] = useState([]);
	const [brands, setBrands] = useState([]);
	const [existingGroups, setExistingGroups] = useState([]);

	// Selections
	const [selectedRoot, setSelectedRoot] = useState(null);
	const [selectedChild, setSelectedChild] = useState(null);
	const [selectedBrand, setSelectedBrand] = useState(null);
	const [name, setName] = useState('');

	// Suggestion list UI
	const [showSuggestions, setShowSuggestions] = useState(false);
	const nameInputRef = useRef(null);
	const suggestionsRef = useRef(null);

	// UI states
	const [loadingRoot, setLoadingRoot] = useState(true);
	const [loadingChild, setLoadingChild] = useState(false);
	const [loadingBrands, setLoadingBrands] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState({});
	const [toast, setToast] = useState(null);

	// ── Initial loads ─────────────────────────────────────────────────────────
	useEffect(() => {
		Promise.all([
			api.get('/public/categories/tree'),
			api.get('/admin/product-group?size=999').catch(() => ({data: {content: []}})),
		])
			.then(([catRes, pgRes]) => {
				setRootCategories(catRes.data || []);
				setExistingGroups(pgRes.data.content || []);
			})
			.catch(() => showToast('error', 'Failed to load initial data'))
			.finally(() => setLoadingRoot(false));
	}, []);

	// ── Click outside → close suggestions ────────────────────────────────────
	useEffect(() => {
		const handler = (e) => {
			if (
				nameInputRef.current &&
				!nameInputRef.current.contains(e.target) &&
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target)
			) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	// ── Root category change ──────────────────────────────────────────────────
	useEffect(() => {
		if (!selectedRoot) {
			setChildCategories([]);
			setBrands([]);
			setSelectedChild(null);
			setSelectedBrand(null);
			return;
		}
		setSelectedChild(null);
		setSelectedBrand(null);
		setChildCategories([]);
		setBrands([]);

		setLoadingChild(true);
		api
			.get(`/public/categories/${selectedRoot.slug}`)
			.then((res) => {
				const data = res.data;
				setChildCategories(Array.isArray(data) ? data : data.children || []);
			})
			.catch(() => showToast('error', 'Failed to load subcategories'))
			.finally(() => setLoadingChild(false));

		setLoadingBrands(true);
		api
			.get(`/admin/brand-category/getBrandIdsByCategoryId/${selectedRoot.id}`)
			.then((res) => {
				const data = res.data || [];
				if (data.length && typeof data[0] === 'object') {
					setBrands(data);
				} else {
					Promise.all(data.map((bid) => api.get(`/admin/brands/${bid}`))).then((results) =>
						setBrands(results.map((r) => r.data)),
					);
				}
			})
			.catch(() => showToast('error', 'Failed to load brands'))
			.finally(() => setLoadingBrands(false));
	}, [selectedRoot]);

	// ── Helpers ───────────────────────────────────────────────────────────────
	const showToast = (type, message) => {
		setToast({type, message});
		setTimeout(() => setToast(null), 4000);
	};

	const existingNames = existingGroups.map((g) => g.name?.toLowerCase().trim());

	const nameError = useCallback(() => {
		if (!name.trim()) return 'Name is required';
		if (existingNames.includes(name.toLowerCase().trim())) return 'This name already exists';
		return null;
	}, [name, existingNames]);

	// Suggestions: any existing group whose name contains the typed string
	const suggestions =
		name.trim().length > 0 ? existingGroups.filter((g) => g.name?.toLowerCase().includes(name.toLowerCase().trim())) : [];

	const isDuplicate = existingNames.includes(name.toLowerCase().trim());

	const validate = () => {
		const e = {};
		if (!selectedRoot) e.root = 'Please select a root category';
		if (!selectedChild) e.child = 'Please select a subcategory';
		if (!selectedBrand) e.brand = 'Please select a brand';
		const ne = nameError();
		if (ne) e.name = ne;
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) {
			window.scrollTo({top: 0, behavior: 'smooth'});
			return;
		}
		setSubmitting(true);
		try {
			await api.post('/admin/product-group', {
				categoryId: selectedChild.id,
				brandId: selectedBrand.id,
				name: name.trim(),
			});
			navigate('/admin/product-groups', {
				state: {showNotification: true, message: `Product group "${name.trim()}" created successfully!`},
			});
		} catch (err) {
			showToast('error', err.response?.data?.message || 'Failed to create product group');
		} finally {
			setSubmitting(false);
		}
	};

	const stepState = (step) => {
		const done = [selectedRoot, selectedChild && selectedBrand, name.trim() && !nameError()];
		if (done[step - 1]) return 'done';
		if (step === 1 || (step === 2 && selectedRoot) || (step === 3 && selectedChild && selectedBrand)) return 'active';
		return 'idle';
	};

	const isReady = selectedRoot && selectedChild && selectedBrand && name.trim() && !nameError();

	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 max-w-3xl mx-auto w-full space-y-6">
					{/* Page header */}
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/admin/product-groups')}
							className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Create Product Group</h1>
							<p className="text-slate-500 text-sm">Fill in all steps to create a new product group</p>
						</div>
					</div>

					{/* Progress steps */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4">
						<div className="flex items-center gap-3 flex-wrap">
							<StepDot num={1} label="Root Category" state={stepState(1)} />
							<ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
							<StepDot num={2} label="Subcategory & Brand" state={stepState(2)} />
							<ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
							<StepDot num={3} label="Name" state={stepState(3)} />
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Step 1 */}
						<Section icon={Layers} title="Root Category" subtitle="Choose the top-level category">
							{loadingRoot ? (
								<div className="flex items-center gap-2 text-slate-400 text-sm">
									<Loader2 size={16} className="animate-spin" /> Loading categories...
								</div>
							) : (
								<>
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{rootCategories.map((cat) => (
											<OptionCard
												key={cat.id}
												label={cat.name}
												sublabel={cat.slug}
												selected={selectedRoot?.id === cat.id}
												onClick={() => setSelectedRoot(cat)}
											/>
										))}
									</div>
									{errors.root && (
										<p className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
											<AlertCircle size={12} /> {errors.root}
										</p>
									)}
								</>
							)}
						</Section>

						{/* Step 2 */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<Section icon={Tag} title="Subcategory" subtitle="categoryId for the group" locked={!selectedRoot}>
								{loadingChild ? (
									<div className="flex items-center gap-2 text-slate-400 text-sm">
										<Loader2 size={16} className="animate-spin" /> Loading...
									</div>
								) : childCategories.length === 0 && selectedRoot ? (
									<p className="text-xs text-slate-400">No subcategories found.</p>
								) : (
									<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
										{childCategories.map((cat) => (
											<OptionCard
												key={cat.id}
												label={cat.name}
												sublabel={`ID: ${cat.id}`}
												selected={selectedChild?.id === cat.id}
												onClick={() => (!selectedRoot ? null : setSelectedChild(cat))}
												disabled={!selectedRoot}
											/>
										))}
									</div>
								)}
								{errors.child && (
									<p className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
										<AlertCircle size={12} /> {errors.child}
									</p>
								)}
							</Section>

							<Section icon={Bookmark} title="Brand" subtitle="brandId for the group" locked={!selectedRoot}>
								{loadingBrands ? (
									<div className="flex items-center gap-2 text-slate-400 text-sm">
										<Loader2 size={16} className="animate-spin" /> Loading...
									</div>
								) : brands.length === 0 && selectedRoot ? (
									<p className="text-xs text-slate-400">No brands found for this category.</p>
								) : (
									<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
										{brands.map((brand) => (
											<OptionCard
												key={brand.id}
												label={brand.name}
												sublabel={brand.slug}
												selected={selectedBrand?.id === brand.id}
												onClick={() => (!selectedRoot ? null : setSelectedBrand(brand))}
												disabled={!selectedRoot}
											/>
										))}
									</div>
								)}
								{errors.brand && (
									<p className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
										<AlertCircle size={12} /> {errors.brand}
									</p>
								)}
							</Section>
						</div>

						{/* Step 3: Name + suggestions */}
						<Section
							icon={Tag}
							title="Product Group Name"
							subtitle="Must be unique across all product groups"
							locked={!selectedChild || !selectedBrand}
						>
							<div className="space-y-2">
								{/* Input */}
								<div className="relative">
									<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
									<input
										ref={nameInputRef}
										type="text"
										value={name}
										onChange={(e) => {
											setName(e.target.value);
											setErrors((prev) => ({...prev, name: undefined}));
											setShowSuggestions(true);
										}}
										onFocus={() => setShowSuggestions(true)}
										disabled={!selectedChild || !selectedBrand}
										placeholder="e.g., iPhone 15 Pro Max"
										className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
											isDuplicate
												? 'border-red-300 bg-red-50 focus:border-red-400'
												: name.trim() && !nameError()
													? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500'
													: errors.name
														? 'border-red-300 bg-red-50'
														: 'border-slate-200 bg-white focus:border-blue-500'
										} disabled:opacity-50 disabled:cursor-not-allowed`}
									/>
								</div>

								{/* Live status badge */}
								{name.trim() && (
									<p
										className={`flex items-center gap-1.5 text-xs font-semibold ${nameError() ? 'text-red-600' : 'text-emerald-600'}`}
									>
										{nameError() ? (
											<>
												<AlertCircle size={12} />
												{nameError()}
											</>
										) : (
											<>
												<Check size={12} />
												Name is available
											</>
										)}
									</p>
								)}
								{errors.name && !name.trim() && (
									<p className="text-xs text-red-600 font-semibold flex items-center gap-1">
										<AlertCircle size={12} /> {errors.name}
									</p>
								)}

								{/* ── Suggestion dropdown ── */}
								{showSuggestions && suggestions.length > 0 && (
									<div ref={suggestionsRef} className="border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
										{/* Header */}
										<div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
											<span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Similar existing names</span>
											<span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
												{suggestions.length} found
											</span>
										</div>

										{/* List */}
										<ul className="max-h-52 overflow-y-auto divide-y divide-slate-50">
											{suggestions.map((g) => {
												const isExact = g.name?.toLowerCase().trim() === name.toLowerCase().trim();
												return (
													<li
														key={g.id}
														className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
															isExact ? 'bg-red-50' : 'hover:bg-slate-50'
														}`}
													>
														{/* Colored dot */}
														<div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isExact ? 'bg-red-500' : 'bg-amber-400'}`} />

														<div className="flex-1 min-w-0">
															<p className={`text-sm font-medium truncate ${isExact ? 'text-red-700' : 'text-slate-700'}`}>
																<HighlightMatch text={g.name} query={name.trim()} />
															</p>
															{/* Optional sublabel: category / brand info if available */}
															{(g.categoryName || g.brandName) && (
																<p className="text-xs text-slate-400 mt-0.5 truncate">
																	{[g.categoryName, g.brandName].filter(Boolean).join(' · ')}
																</p>
															)}
														</div>

														{isExact ? (
															<span className="flex-shrink-0 text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
																Duplicate!
															</span>
														) : (
															<span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
																Similar
															</span>
														)}
													</li>
												);
											})}
										</ul>

										{/* Footer */}
										<div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
											<button
												type="button"
												onClick={() => setShowSuggestions(false)}
												className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
											>
												Hide suggestions
											</button>
										</div>
									</div>
								)}

								{/* No matches feedback */}
								{showSuggestions && name.trim().length > 0 && suggestions.length === 0 && !isDuplicate && (
									<p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
										<Check size={12} /> No similar names — looks unique!
									</p>
								)}
							</div>
						</Section>

						{/* Summary */}
						{isReady && (
							<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
								<p className="text-xs font-bold text-blue-700 uppercase mb-3">Summary — Ready to create</p>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<p className="text-xs text-slate-500">Root Category</p>
										<p className="font-semibold text-slate-800">{selectedRoot?.name}</p>
									</div>
									<div>
										<p className="text-xs text-slate-500">Subcategory (categoryId)</p>
										<p className="font-semibold text-slate-800">
											{selectedChild?.name} <span className="text-slate-400 font-normal">#{selectedChild?.id}</span>
										</p>
									</div>
									<div>
										<p className="text-xs text-slate-500">Brand (brandId)</p>
										<p className="font-semibold text-slate-800">
											{selectedBrand?.name} <span className="text-slate-400 font-normal">#{selectedBrand?.id}</span>
										</p>
									</div>
									<div>
										<p className="text-xs text-slate-500">Name</p>
										<p className="font-semibold text-slate-800">{name.trim()}</p>
									</div>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex gap-3 pb-8">
							<button
								type="submit"
								disabled={submitting}
								className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm"
							>
								{submitting ? (
									<>
										<Loader2 size={16} className="animate-spin" /> Creating...
									</>
								) : (
									<>
										<Check size={16} /> Create Product Group
									</>
								)}
							</button>
							<button
								type="button"
								onClick={() => navigate('/admin/product-groups')}
								disabled={submitting}
								className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 text-sm"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</main>

			{/* Toast */}
			{toast && (
				<div
					className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold transition-all ${
						toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
					}`}
				>
					{toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
					{toast.message}
				</div>
			)}
		</div>
	);
}
