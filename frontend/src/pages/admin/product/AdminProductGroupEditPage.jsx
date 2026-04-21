import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Check, X, AlertCircle, Loader2, Search, Tag} from 'lucide-react';
import api from '@/services/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// ─── Highlight match ──────────────────────────────────────────────────────────
function HighlightMatch({text, query}) {
	if (!query.trim()) return <span>{text}</span>;
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escaped})`, 'gi');
	const parts = text.split(regex);
	return (
		<span>
			{parts.map((part, i) =>
				part.toLowerCase() === query.toLowerCase() ? (
					<mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5 font-bold not-italic">
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</span>
	);
}

export default function AdminProductGroupEditPage() {
	const {groupId} = useParams();
	const navigate = useNavigate();

	// ── Data ────────────────────────────────────────────────────────────────
	const [group, setGroup] = useState(null);
	const [allGroups, setAllGroups] = useState([]); // for unique check
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// ── Form fields ─────────────────────────────────────────────────────────
	const [name, setName] = useState('');
	const [status, setStatus] = useState(true);

	// ── Suggestion list ─────────────────────────────────────────────────────
	const [showSuggestions, setShowSuggestions] = useState(false);
	const nameInputRef = useRef(null);
	const suggestionsRef = useRef(null);

	// ── Feedback ────────────────────────────────────────────────────────────
	const [errors, setErrors] = useState({});
	const [toast, setToast] = useState(null);

	// ── Load data ────────────────────────────────────────────────────────────
	useEffect(() => {
		Promise.all([
			api.get(`/admin/product-group/${groupId}`),
			api.get('/admin/product-group?size=999').catch(() => ({data: {content: []}})),
		])
			.then(([groupRes, allRes]) => {
				const g = groupRes.data;
				setGroup(g);
				setName(g.name || '');
				setStatus(g.status ?? true);
				setAllGroups(allRes.data.content || []);
			})
			.catch(() => showToast('error', 'Failed to load product group'))
			.finally(() => setLoading(false));
	}, [groupId]);

	// ── Click outside → close suggestions ───────────────────────────────────
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

	// ── Helpers ──────────────────────────────────────────────────────────────
	const showToast = (type, message) => {
		setToast({type, message});
		setTimeout(() => setToast(null), 4000);
	};

	// Other groups excluding current one
	// const otherGroups = allGroups.filter((g) => String(g.groupId) !== String(groupId));
	const otherGroups = allGroups.filter((g) => String(g.id) !== String(groupId));
	const otherNames = otherGroups.map((g) => g.name?.toLowerCase().trim());

	const nameError = useCallback(() => {
		if (!name.trim()) return 'Name is required';
		if (otherNames.includes(name.toLowerCase().trim())) return 'This name already exists';
		return null;
	}, [name, otherNames]);

	const isDuplicate = otherNames.includes(name.toLowerCase().trim());

	// Suggestions: other groups whose name contains the typed string
	const suggestions =
		name.trim().length > 0 ? otherGroups.filter((g) => g.name?.toLowerCase().includes(name.toLowerCase().trim())) : [];

	const hasChanges = group && (name.trim() !== group.name || status !== group.status);

	const validate = () => {
		const e = {};
		const ne = nameError();
		if (ne) e.name = ne;
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	// ── Submit ───────────────────────────────────────────────────────────────
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;

		setSaving(true);
		try {
			await api.put(`/admin/product-group/${groupId}`, {
				name: name.trim(),
				status,
			});
			navigate('/admin/products/groups', {
				state: {showNotification: true, message: `Product group "${name.trim()}" updated successfully!`},
			});
		} catch (err) {
			showToast('error', err.response?.data?.message || 'Failed to update product group');
		} finally {
			setSaving(false);
		}
	};

	// ─── Loading ──────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="flex min-h-screen bg-slate-50">
				<AdminSidebar />
				<main className="flex-1 flex flex-col min-w-0">
					<AdminHeader />
					<div className="flex items-center justify-center flex-1">
						<div className="flex flex-col items-center gap-3 text-slate-400">
							<div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
							<span className="text-sm">Loading...</span>
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

	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div className="flex min-h-screen bg-slate-50">
			<AdminSidebar />

			<main className="flex-1 flex flex-col min-w-0">
				<AdminHeader />

				<div className="p-8 max-w-2xl mx-auto w-full space-y-6">
					{/* Page header */}
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/admin/products/groups')}
							className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className="text-2xl font-bold text-slate-800">Edit Product Group</h1>
							<p className="text-slate-500 text-sm">
								ID #{groupId} · {group.brand?.name} · {group.category?.name}
							</p>
						</div>
					</div>

					{/* Read-only info card */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
						<p className="text-xs font-bold text-slate-500 uppercase mb-3">Group Info (read-only)</p>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-xs text-slate-400 mb-0.5">Brand</p>
								<p className="font-semibold text-slate-700">{group.brand?.name || '—'}</p>
							</div>
							<div>
								<p className="text-xs text-slate-400 mb-0.5">Category</p>
								<p className="font-semibold text-slate-700">{group.category?.name || '—'}</p>
							</div>
							{group.category?.parent && (
								<div>
									<p className="text-xs text-slate-400 mb-0.5">Root Category</p>
									<p className="font-semibold text-slate-700">{group.category.parent.name}</p>
								</div>
							)}
							<div>
								<p className="text-xs text-slate-400 mb-0.5">Created At</p>
								<p className="font-semibold text-slate-700">
									{group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : '—'}
								</p>
							</div>
						</div>
					</div>

					{/* Edit form */}
					<form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
						<p className="text-xs font-bold text-slate-500 uppercase">Editable Fields</p>

						{/* Name field */}
						<div className="space-y-2">
							<label className="block text-sm font-semibold text-slate-700">
								Group Name <span className="text-red-500">*</span>
							</label>

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
									placeholder="e.g., iPhone 15 Pro Max"
									className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
										isDuplicate || errors.name
											? 'border-red-300 bg-red-50 focus:border-red-400'
											: name.trim() && !nameError()
												? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500'
												: 'border-slate-200 bg-white focus:border-blue-500'
									}`}
								/>
							</div>

							{/* Live status */}
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

							{/* Suggestion dropdown */}
							{showSuggestions && suggestions.length > 0 && (
								<div ref={suggestionsRef} className="border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
									<div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
										<span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Similar existing names</span>
										<span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
											{suggestions.length} found
										</span>
									</div>

									<ul className="max-h-48 overflow-y-auto divide-y divide-slate-50">
										{suggestions.map((g) => {
											const isExact = g.name?.toLowerCase().trim() === name.toLowerCase().trim();
											return (
												<li
													key={g.id}
													className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
														isExact ? 'bg-red-50' : 'hover:bg-slate-50'
													}`}
												>
													<div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isExact ? 'bg-red-500' : 'bg-amber-400'}`} />
													<div className="flex-1 min-w-0">
														<p className={`text-sm font-medium truncate ${isExact ? 'text-red-700' : 'text-slate-700'}`}>
															<HighlightMatch text={g.name} query={name.trim()} />
														</p>
														<p className="text-xs text-slate-400 mt-0.5">ID #{g.id}</p>
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

							{showSuggestions && name.trim().length > 0 && suggestions.length === 0 && !nameError() && (
								<p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
									<Check size={12} /> No similar names — looks unique!
								</p>
							)}
						</div>

						{/* Status toggle */}
						<div className="space-y-2">
							<label className="block text-sm font-semibold text-slate-700">Status</label>
							<div className="flex items-center gap-4">
								{/* Toggle switch */}
								<label className="inline-flex items-center gap-3 cursor-pointer select-none">
									<div className="relative">
										<input
											type="checkbox"
											className="sr-only peer"
											checked={status}
											onChange={(e) => setStatus(e.target.checked)}
										/>
										<div className="w-11 h-6 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors duration-200" />
										<div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5" />
									</div>
									<span className={`text-sm font-semibold transition-colors ${status ? 'text-emerald-600' : 'text-slate-400'}`}>
										{status ? 'Active' : 'Inactive'}
									</span>
								</label>

								{/* Badge preview */}
								<span
									className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
										status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
									}`}
								>
									{status ? 'Active' : 'Inactive'}
								</span>
							</div>
							<p className="text-xs text-slate-400">
								{status ? 'Group is visible and available for product assignment.' : 'Group is hidden from customers.'}
							</p>
						</div>

						{/* Changed indicator */}
						{hasChanges && (
							<div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
								<AlertCircle size={13} />
								You have unsaved changes
							</div>
						)}

						{/* Action buttons */}
						<div className="flex gap-3 pt-2">
							<button
								type="submit"
								disabled={saving || !!nameError()}
								className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm"
							>
								{saving ? (
									<>
										<Loader2 size={15} className="animate-spin" /> Saving...
									</>
								) : (
									<>
										<Check size={15} /> Save Changes
									</>
								)}
							</button>
							<button
								type="button"
								onClick={() => navigate('/admin/products/groups')}
								disabled={saving}
								className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 text-sm"
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
					className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold ${
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
