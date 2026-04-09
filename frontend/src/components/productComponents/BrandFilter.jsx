import React from 'react';

const IMAGE_BASE_URL = 'http://localhost:8081';

export default function BrandFilter({brands, selectedBrandIds, onBrandSelect, onClearAll}) {
	if (!brands || brands.length === 0) return null;

	const handleBrandClick = (brandId) => {
		const brandIdStr = String(brandId);
		const newIds = selectedBrandIds.includes(brandIdStr)
			? selectedBrandIds.filter((id) => id !== brandIdStr)
			: [...selectedBrandIds, brandIdStr];
		onBrandSelect(newIds);
	};

	return (
		<div className="flex items-center gap-3 flex-wrap mb-4">
			{/* Clear Button - Always rendered to prevent layout shift */}
			{/* <button
				onClick={onClearAll}
				disabled={selectedBrandIds.length === 0}
				className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
					selectedBrandIds.length > 0
						? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200 cursor-pointer'
						: 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
				}`}
			>
				✕ Xóa lọc
			</button> */}

			{/* Brand Buttons */}
			{brands.map((brand) => {
				const isSelected = selectedBrandIds.includes(String(brand.id));
				return (
					<button
						key={brand.id}
						onClick={() => handleBrandClick(brand.id)}
						className={`flex items-center w-25 justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
							isSelected
								? 'border-blue-500 bg-blue-100 text-blue-700'
								: 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
						}`}
						title={brand.name}
					>
						{brand.logoUrl && (
							<img
								src={brand.logoUrl.startsWith('/') ? IMAGE_BASE_URL + brand.logoUrl : brand.logoUrl}
								alt={brand.name}
								className="w-full h-5 object-contain"
							/>
						)}
						{/* <span className="text-sm font-medium whitespace-nowrap">{brand.name}</span> */}
					</button>
				);
			})}
		</div>
	);
}
