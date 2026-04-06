// src/components/FilterPanel.jsx
import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp, faXmark} from '@fortawesome/free-solid-svg-icons';

function PriceRange({minPrice, maxPrice, onChange}) {
	const [min, setMin] = useState(minPrice || '');
	const [max, setMax] = useState(maxPrice || '');

	const handleApply = () => {
		onChange({minPrice: min, maxPrice: max});
	};

	const handleClear = () => {
		setMin('');
		setMax('');
		onChange({minPrice: '', maxPrice: ''});
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<input
					type="number"
					placeholder="Min"
					value={min}
					onChange={(e) => setMin(e.target.value)}
					className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
				/>
				<span className="text-gray-400 flex-shrink-0">—</span>
				<input
					type="number"
					placeholder="Max"
					value={max}
					onChange={(e) => setMax(e.target.value)}
					className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
				/>
			</div>
			<div className="flex gap-2">
				<button
					onClick={handleApply}
					className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Apply
				</button>
				{(min || max) && (
					<button
						onClick={handleClear}
						className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
					>
						Clear
					</button>
				)}
			</div>
		</div>
	);
}

function FilterSection({label, children, defaultOpen = true}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
			<button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full mb-3 group">
				<span className="text-sm font-medium text-gray-700">{label}</span>
				<FontAwesomeIcon
					icon={open ? faChevronUp : faChevronDown}
					style={{fontSize: 11}}
					className="text-gray-400 group-hover:text-gray-600 transition-colors"
				/>
			</button>
			{open && children}
		</div>
	);
}

export default function FilterPanel({config, filters, brands, onChange, onClear}) {
	const hasAnyFilter =
		Object.keys(filters.attributes || {}).some((k) => filters.attributes[k]) ||
		filters.minPrice ||
		filters.maxPrice ||
		filters.brandIds?.length > 0;

	return (
		<div className="bg-white border border-gray-200 rounded-2xl p-4 sticky top-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<span className="text-sm font-semibold text-gray-800">Filters</span>
				{hasAnyFilter && (
					<button
						onClick={onClear}
						className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
					>
						<FontAwesomeIcon icon={faXmark} style={{fontSize: 10}} />
						Clear all
					</button>
				)}
			</div>

			{/* Price range */}
			<FilterSection label="Price (USD)">
				<PriceRange
					minPrice={filters.minPrice}
					maxPrice={filters.maxPrice}
					onChange={({minPrice, maxPrice}) => onChange({minPrice, maxPrice})}
				/>
			</FilterSection>

			{/* Brands */}
			{brands?.length > 0 && (
				<FilterSection label="Brand">
					<div className="flex flex-col gap-2">
						{brands.map((brand) => {
							const checked = filters.brandIds?.includes(String(brand.id));
							return (
								<label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={!!checked}
										onChange={() => {
											const prev = filters.brandIds || [];
											const next = checked ? prev.filter((id) => id !== String(brand.id)) : [...prev, String(brand.id)];
											onChange({brandIds: next});
										}}
										className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
									/>
									<span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{brand.name}</span>
								</label>
							);
						})}
					</div>
				</FilterSection>
			)}

			{/* Attribute filters */}
			{config?.attributes?.map((attr) => (
				<FilterSection key={attr.key} label={attr.label} defaultOpen={true}>
					<div className="flex flex-col gap-2">
						{attr.options.map((opt) => {
							const checked = filters.attributes?.[attr.key] === opt;
							return (
								<label key={opt} className="flex items-center gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={!!checked}
										onChange={() => {
											onChange({
												attributes: {
													...filters.attributes,
													[attr.key]: checked ? '' : opt,
												},
											});
										}}
										className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
									/>
									<span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{opt}</span>
								</label>
							);
						})}
					</div>
				</FilterSection>
			))}
		</div>
	);
}
