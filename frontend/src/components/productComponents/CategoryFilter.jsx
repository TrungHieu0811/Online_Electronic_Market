import React from 'react';

const IMAGE_BASE_URL = 'http://localhost:8081';

export default function CategoryFilter({categories, selectedCategoryIds, onCategorySelect, onClearAll}) {
	if (!categories || categories.length === 0) return null;

	const handleCategoryClick = (categoryId) => {
		const categoryIdStr = String(categoryId);
		const newIds = selectedCategoryIds.includes(categoryIdStr)
			? selectedCategoryIds.filter((id) => id !== categoryIdStr)
			: [...selectedCategoryIds, categoryIdStr];
		onCategorySelect(newIds);
	};

	return (
		<div className="flex items-center gap-3 flex-wrap mb-4">
			{/* Clear Button - Always rendered to prevent layout shift */}
			{/* <button
				onClick={onClearAll}
				disabled={selectedCategoryIds.length === 0}
				className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
					selectedCategoryIds.length > 0
						? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200 cursor-pointer'
						: 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
				}`}
			>
				✕ Xóa lọc
			</button> */}

			{/* Category Buttons */}
			{categories.map((category) => {
				const isSelected = selectedCategoryIds.includes(String(category.id));
				return (
					<button
						key={category.id}
						onClick={() => handleCategoryClick(category.id)}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
							isSelected
								? 'border-blue-500 bg-blue-100 text-blue-700'
								: 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
						}`}
						title={category.name}
					>
						<span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
					</button>
				);
			})}
		</div>
	);
}
