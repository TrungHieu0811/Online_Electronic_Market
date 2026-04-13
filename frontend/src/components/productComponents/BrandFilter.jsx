import React from 'react';

const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

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
