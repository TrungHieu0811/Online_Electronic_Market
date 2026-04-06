import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faShield, faCartPlus, faBan, faStar, faStarHalfStroke, faImage} from '@fortawesome/free-solid-svg-icons';
import {faStar as faStarEmpty, faHeart} from '@fortawesome/free-regular-svg-icons';
import {useNavigate} from 'react-router-dom';
function StarRating({rating}) {
	const snapped = Math.round(rating * 2) / 2;
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => {
				const full = snapped >= i;
				const half = snapped >= i - 0.5 && snapped < i;
				return (
					<FontAwesomeIcon
						key={i}
						icon={full ? faStar : half ? faStarHalfStroke : faStarEmpty}
						style={{fontSize: 11, color: full || half ? '#EF9F27' : '#D3D1C7'}}
					/>
				);
			})}
			{/* <span className="text-xs text-gray-400 ml-1">{snapped.toFixed(1)}</span> */}
			<span className="text-xs text-gray-400 ml-1">{rating}</span>
		</div>
	);
}

function isNewProduct(createdAt) {
	if (!createdAt) return false;
	return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 3600 * 1000;
}

function discountPct(basePrice, salePrice) {
	if (basePrice <= salePrice) return 0;
	return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

function fmtPrice(v) {
	return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(v);
}
export default function ProductCard({item, onAddToCart, onWishlist}) {
	const navigate = useNavigate();
	const {
		id,
		variantName,
		averageRating,
		basePrice,
		salePrice,
		viewCount,
		isFeatured,
		stockQuantity,
		status, // thêm
		createdAt,
		warrantyMonths,
		brand,
		category,
		imageList,
	} = item;

	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
	const isActive = status === 'ACTIVE';
	const outOfStock = stockQuantity === 0;
	const unavailable = !isActive || outOfStock; // dùng chung để disable button
	const pct = discountPct(basePrice, salePrice);
	const hasDiscount = pct > 0;
	const newProduct = isNewProduct(createdAt);
	const primaryImage = imageList?.[0]?.imageUrl;

	const leftBadge = !isActive ? (
		<div className="absolute inset-0 bg-black-40 flex items-center justify-center">
			<span className="bg-gray-50 text-black text-lg font-medium px-3 py-2 rounded-lg">Discontinued</span>
		</div>
	) : isFeatured ? (
		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">
			Featured
		</span>
	) : viewCount > 1000 ? (
		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">Hot</span>
	) : newProduct ? (
		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
			New
		</span>
	) : null;

	return (
		<div
			className={`w-full h-full bg-white border rounded-xl overflow-hidden flex flex-col transition-colors
			${!isActive ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-gray-300'}`}
		>
			{/* Image */}
			<div className="relative p-1 bg-gray-50 h-40 flex-shrink-0 flex items-center justify-center overflow-hidden">
				{primaryImage ? (
					<img
						src={primaryImage.startsWith('/') ? IMAGE_BASE_URL + primaryImage : primaryImage}
						alt={variantName}
						className={`w-full h-full border border-gray-200 rounded-lg object-cover
							${!isActive ? 'grayscale' : ''}`}
					/>
				) : (
					<FontAwesomeIcon icon={faImage} style={{fontSize: 40, color: '#D1D5DB'}} />
				)}
				{leftBadge}
				{hasDiscount && isActive && (
					<span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-red-700">
						-{pct}%
					</span>
				)}
				{/* Overlay: ưu tiên DEACTIVE > out of stock */}
				{!isActive ? (
					<div className="absolute inset-0 bg-gray-500/20 flex items-center justify-center" />
				) : outOfStock ? (
					<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
						<span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1 rounded-md">Out of stock</span>
					</div>
				) : null}
			</div>

			{/* Body */}
			<div className="p-3 flex flex-col flex-1">
				{/* Brand + Category */}
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-1 min-w-0">
						{brand?.logoUrl && (
							<img
								src={brand.logoUrl.startsWith('/') ? IMAGE_BASE_URL + brand.logoUrl : brand.logoUrl}
								className={`w-10 h-3.5 flex-shrink-0 rounded object-contain ${!isActive ? 'grayscale' : ''}`}
								alt={brand.name}
							/>
						)}
					</div>
					<span className="text-xs text-gray-400 truncate ml-1 flex-shrink-0">{category?.name}</span>
				</div>

				{/* Product name */}
				<p
					onClick={() => navigate(`/products/${item.slug}`)}
					className="text-sm font-medium text-gray-900 leading-snug mb-1.5 cursor-pointer hover:text-blue-600 transition-colors5"
					style={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						minHeight: '2.5rem',
					}}
					title={variantName}
				>
					{variantName}
				</p>

				{/* Stars */}
				<div className="mb-1">
					<StarRating rating={averageRating} />
				</div>

				{/* Views + Warranty */}
				<div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
					<span className="flex items-center gap-1">
						<FontAwesomeIcon icon={faEye} style={{fontSize: 11}} />
						{viewCount.toLocaleString()} views
					</span>
					{warrantyMonths && (
						<span className="flex items-center gap-1">
							<FontAwesomeIcon icon={faShield} style={{fontSize: 11}} />
							{warrantyMonths}m warranty
						</span>
					)}
				</div>

				{/* Price */}
				<div className="flex items-baseline gap-1.5 mt-auto mb-3">
					<span className={`text-base font-semibold ${hasDiscount && isActive ? 'text-orange-600' : 'text-gray-900'}`}>
						{fmtPrice(salePrice)}
					</span>
					{hasDiscount && isActive && <span className="text-xs text-gray-400 line-through">{fmtPrice(basePrice)}</span>}
				</div>

				{/* Buttons */}
				<div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
					<button
						onClick={() => isActive && !outOfStock && onAddToCart?.(id)}
						disabled={unavailable}
						className={`flex-1 py-1.5 flex items-center justify-center border rounded-lg transition-colors
                            ${unavailable ? 'opacity-40 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:bg-gray-50 active:scale-95'}`}
						title={!isActive ? 'Discontinued' : outOfStock ? 'Out of stock' : 'Add to cart'}
					>
						<FontAwesomeIcon
							icon={unavailable ? faBan : faCartPlus}
							style={{fontSize: 14, color: unavailable ? '#9CA3AF' : '#374151'}}
						/>
					</button>
				</div>
			</div>
		</div>
	);
}

// import React from 'react';
// import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
// import {faEye, faShield, faCartPlus, faBan, faStar, faStarHalfStroke, faImage} from '@fortawesome/free-solid-svg-icons';
// import {faStar as faStarEmpty, faHeart} from '@fortawesome/free-regular-svg-icons';

// function StarRating({rating}) {
// 	const snapped = Math.round(rating * 2) / 2;
// 	return (
// 		<div className="flex items-center gap-0.5">
// 			{[1, 2, 3, 4, 5].map((i) => {
// 				const full = snapped >= i;
// 				const half = snapped >= i - 0.5 && snapped < i;
// 				return (
// 					<FontAwesomeIcon
// 						key={i}
// 						icon={full ? faStar : half ? faStarHalfStroke : faStarEmpty}
// 						style={{fontSize: 11, color: full || half ? '#EF9F27' : '#D3D1C7'}}
// 					/>
// 				);
// 			})}
// 			<span className="text-xs text-gray-400 ml-1">{snapped.toFixed(1)}</span>
// 		</div>
// 	);
// }

// function isNewProduct(createdAt) {
// 	if (!createdAt) return false;
// 	return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 3600 * 1000;
// }

// function discountPct(basePrice, salePrice) {
// 	if (basePrice <= salePrice) return 0;
// 	return Math.round(((basePrice - salePrice) / basePrice) * 100);
// }

// function fmtPrice(v) {
// 	return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(v);
// }

// export default function ProductCard({item, onAddToCart, onWishlist}) {
// 	const {
// 		id,
// 		variantName,
// 		averageRating,
// 		basePrice,
// 		salePrice,
// 		viewCount,
// 		isFeatured,
// 		stockQuantity,
// 		status,
// 		createdAt,
// 		warrantyMonths,
// 		brand,
// 		category,
// 		imageList,
// 	} = item;

// 	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';
// 	const outOfStock = stockQuantity === 0;
// 	const pct = discountPct(basePrice, salePrice);
// 	const hasDiscount = pct > 0;
// 	const newProduct = isNewProduct(createdAt);
// 	const primaryImage = imageList?.[0]?.imageUrl;

// 	const leftBadge = isFeatured ? (
// 		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">
// 			Featured
// 		</span>
// 	) : viewCount > 1000 ? (
// 		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">Hot</span>
// 	) : newProduct ? (
// 		<span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
// 			New
// 		</span>
// 	) : null;

// 	return (
// 		<div className="w-full h-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-gray-300 transition-colors">
// 			{/* Image */}
// 			<div className="relative p-1 bg-gray-50 h-40 flex-shrink-0 flex items-center justify-center overflow-hidden">
// 				{primaryImage ? (
// 					<img
// 						src={primaryImage.startsWith('/') ? IMAGE_BASE_URL + primaryImage : primaryImage}
// 						alt={variantName}
// 						className="w-full h-full border border-gray-200 rounded-lg object-cover"
// 					/>
// 				) : (
// 					<FontAwesomeIcon icon={faImage} style={{fontSize: 40, color: '#D1D5DB'}} />
// 				)}
// 				{leftBadge}
// 				{hasDiscount && (
// 					<span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-red-700">
// 						-{pct}%
// 					</span>
// 				)}
// 				{outOfStock && (
// 					<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
// 						<span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1 rounded-md">Out of stock</span>
// 					</div>
// 				)}
// 			</div>

// 			{/* Body */}
// 			<div className="p-3 flex flex-col flex-1">
// 				{/* Brand + Category */}
// 				<div className="flex items-center justify-between mb-1">
// 					<div className="flex items-center gap-1 min-w-0">
// 						{brand?.logoUrl && (
// 							<img
// 								src={brand.logoUrl.startsWith('/') ? IMAGE_BASE_URL + brand.logoUrl : brand.logoUrl}
// 								className="w-10 h-3.5 flex-shrink-0 rounded object-contain"
// 								alt={brand.name}
// 							/>
// 						)}
// 						{/* <span className="text-xs text-gray-500 truncate">{brand?.name}</span> */}
// 					</div>
// 					<span className="text-xs text-gray-400 truncate ml-1 flex-shrink-0">{category?.name}</span>
// 				</div>

// 				{/* Product name — cố định 2 dòng, hover hiện full */}
// 				<p
// 					className="text-sm font-medium text-gray-900 leading-snug mb-1.5"
// 					style={{
// 						display: '-webkit-box',
// 						WebkitLineClamp: 2,
// 						WebkitBoxOrient: 'vertical',
// 						overflow: 'hidden',
// 						minHeight: '2.5rem',
// 					}}
// 					title={variantName}
// 				>
// 					{variantName}
// 				</p>

// 				{/* Stars */}
// 				<div className="mb-1">
// 					<StarRating rating={averageRating} />
// 				</div>

// 				{/* Views + Warranty */}
// 				<div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
// 					<span className="flex items-center gap-1">
// 						<FontAwesomeIcon icon={faEye} style={{fontSize: 11}} />
// 						{viewCount.toLocaleString()} views
// 					</span>
// 					{warrantyMonths && (
// 						<span className="flex items-center gap-1">
// 							<FontAwesomeIcon icon={faShield} style={{fontSize: 11}} />
// 							{warrantyMonths}m warranty
// 						</span>
// 					)}
// 				</div>

// 				{/* Price — đẩy xuống đáy */}
// 				<div className="flex items-baseline gap-1.5 mt-auto mb-3">
// 					<span className={`text-base font-semibold ${hasDiscount ? 'text-orange-600' : 'text-gray-900'}`}>
// 						{fmtPrice(salePrice)}
// 					</span>
// 					{hasDiscount && <span className="text-xs text-gray-400 line-through">{fmtPrice(basePrice)}</span>}
// 				</div>

// 				{/* Buttons */}
// 				<div className="flex items-center gap-1.5">
// 					<button
// 						onClick={() => !outOfStock && onAddToCart?.(id)}
// 						disabled={outOfStock}
// 						className={`flex-1 py-1.5 flex items-center justify-center border border-gray-300 rounded-lg transition-colors
// 							${outOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 active:scale-95'}`}
// 						title={outOfStock ? 'Out of stock' : 'Add to cart'}
// 					>
// 						<FontAwesomeIcon
// 							icon={outOfStock ? faBan : faCartPlus}
// 							style={{fontSize: 14, color: outOfStock ? '#9CA3AF' : '#374151'}}
// 						/>
// 					</button>
// 					<button
// 						onClick={() => onWishlist?.(id)}
// 						className="w-7 h-7 flex-shrink-0 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-red-400 transition-colors"
// 						title="Save to wishlist"
// 					>
// 						<FontAwesomeIcon icon={faHeart} style={{fontSize: 13}} />
// 					</button>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
