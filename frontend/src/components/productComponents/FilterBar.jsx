import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faXmark, faFilter} from '@fortawesome/free-solid-svg-icons';

export default function FilterBar({
	config,
	filters,
	onFilterChange,
	onClearAll,
	onApply,
	onRemoveFilter,
	brands = [],
	showFilterModal,
	setShowFilterModal,
	onCancel,
}) {
	const allFilters = config?.brand ? [config.brand, ...(config?.attributes || [])] : config?.attributes || [];

	const handleSelectOption = (filterKey, option) => {
		if (filterKey === 'brandIds') {
			const optionStr = String(option);
			const currentValues = filters.brandIds ?? [];
			const isSelected = currentValues.includes(optionStr);
			const updated = isSelected ? currentValues.filter((v) => v !== optionStr) : [...currentValues, optionStr];
			onFilterChange({brandIds: updated});
		} else {
			const currentValues = filters.attributes?.[filterKey] ?? [];
			const isSelected = currentValues.includes(option);
			const updated = isSelected ? currentValues.filter((v) => v !== option) : [...currentValues, option];
			onFilterChange({
				attributes: {
					...filters.attributes,
					[filterKey]: updated,
				},
			});
		}
	};

	const handlePriceChange = (type, value) => {
		onFilterChange({[type]: value});
	};

	const hasActiveFilters =
		filters.brandIds?.length > 0 ||
		Object.values(filters.attributes || {}).some((arr) => arr?.length > 0) ||
		filters.minPrice ||
		filters.maxPrice;

	const handleApplyFilters = () => {
		setShowFilterModal(false);
		onApply();
	};

	const handleClearAllFilters = () => {
		onClearAll();
	};

	return (
		<div className="bg-white border-b border-gray-200 mb-3">
			<div className="max-w-6xl mx-auto pe-4 min-h-[25px] my-2">
				{/* Active Filter Tags */}
				{hasActiveFilters && (
					<div className="flex flex-wrap gap-2">
						{/* Attribute Tags */}
						{Object.entries(filters.attributes || {}).map(([key, values]) =>
							(values || []).map((value) => (
								<span
									key={`${key}-${value}`}
									className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
								>
									{value}
									<button onClick={() => onRemoveFilter('attribute', {key, value})} className="hover:text-blue-900">
										<FontAwesomeIcon icon={faXmark} style={{fontSize: 10}} />
									</button>
								</span>
							)),
						)}
						{/* Price Tags */}
						{(filters.minPrice || filters.maxPrice) && (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
								Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
								<button onClick={() => onRemoveFilter('price')} className="hover:text-blue-900">
									<FontAwesomeIcon icon={faXmark} style={{fontSize: 10}} />
								</button>
							</span>
						)}
					</div>
				)}
			</div>

			{/* Filter Modal */}
			{showFilterModal && (
				<div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center py-4">
					<div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[60vh] flex flex-col mx-4 overflow-hidden">
						{/* Modal Header */}
						{/* <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-gray-900">Tất cả bộ lọc</h2>
							<button
								onClick={() => {
									setShowFilterModal(false);
									handleClearAllFilters();
									onCancel?.();
								}}
								className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<FontAwesomeIcon icon={faXmark} style={{fontSize: 18}} />
							</button>
						</div> */}

						{/* Modal Content */}
						<div className="px-4 py-3 overflow-y-auto flex-1">
							{/* Filter Groups */}
							{allFilters.map((filterGroup) => (
								<div key={filterGroup.key} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
									<h3 className="text-sm font-semibold text-gray-900 mb-2">{filterGroup.label}</h3>
									<div className="flex flex-wrap gap-2">
										{filterGroup.options.map((option) => {
											const optionId = typeof option === 'object' ? option.id : option;
											const optionLabel = typeof option === 'object' ? option.name : option;

											const isSelected =
												filterGroup.key === 'brandIds'
													? (filters.brandIds ?? []).includes(String(optionId))
													: (filters.attributes?.[filterGroup.key] ?? []).includes(optionLabel);

											return (
												<button
													key={optionId}
													onClick={() => handleSelectOption(filterGroup.key, optionId)}
													className={`px-3 py-1 border rounded-lg text-sm whitespace-nowrap transition-colors cursor-pointer ${
														isSelected
															? 'bg-blue-500 border-blue-500 text-white'
															: 'border-gray-300 text-gray-700 hover:border-blue-300'
													}`}
												>
													{optionLabel}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>

						{/* Modal Footer */}
						<div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex gap-2">
							<button
								onClick={() => {
									setShowFilterModal(false);
									onCancel?.();
									handleClearAllFilters();
								}}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
							>
								Xóa filter
							</button>
							<button
								onClick={handleApplyFilters}
								className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
							>
								Áp dụng
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
