// src/config/filterConfigs.js

export const FILTER_CONFIGS = {
	mobile: {
		brand: {
			key: 'brandIds',
			label: 'Brand',
			options: [], // Sẽ fetch từ backend
		},
		categories: {
			key: 'categoryIds',
			label: 'Category',
			options: [], // Sẽ fetch từ backend
		},
		attributes: [
			{key: 'Storage', label: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB']},
			{key: 'RAM', label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB', '16GB']},
			{key: 'Display', label: 'Display', options: ['OLED', 'AMOLED', 'LCD', 'Retina']},
			{key: 'OS', label: 'OS', options: ['iOS', 'Android']},
			{key: 'Battery', label: 'Battery', options: ['3000mAh', '4000mAh', '5000mAh', '6000mAh']},
		],
	},
	laptop: {
		brand: {
			key: 'brandIds',
			label: 'Brand',
			options: [], // Sẽ fetch từ backend
		},
		categories: {
			key: 'categoryIds',
			label: 'Category',
			options: [], // Sẽ fetch từ backend
		},
		attributes: [
			{key: 'RAM', label: 'RAM', options: ['8GB', '16GB', '32GB', '64GB']},
			{key: 'Storage', label: 'Storage', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD']},
			{
				key: 'Processor',
				label: 'CPU',
				options: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2', 'Apple M3'],
			},
			{key: 'Display', label: 'Screen size', options: ['13 inch', '14 inch', '15.6 inch', '16 inch', '17 inch']},
			{
				key: 'Graphics',
				label: 'GPU',
				options: ['Intel Iris Xe', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'AMD Radeon'],
			},
		],
	},
	tablet: {
		brand: {key: 'brandIds', label: 'Brand', options: []}, // Sẽ fetch từ backend
		attributes: [
			{key: 'Storage', label: 'Storage', options: ['64GB', '128GB', '256GB', '512GB']},
			{key: 'RAM', label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB']},
			{key: 'Display', label: 'Screen size', options: ['8 inch', '10 inch', '11 inch', '12.9 inch']},
			{key: 'OS', label: 'OS', options: ['iPadOS', 'Android']},
			{key: 'Connectivity', label: 'Connectivity', options: ['WiFi', 'WiFi + 4G', 'WiFi + 5G']},
		],
	},
	accessories: {
		brand: {key: 'brandIds', label: 'Brand', options: []}, // Sẽ fetch từ backend
		attributes: [
			{key: 'Type', label: 'Type', options: ['Headphones', 'Charger', 'Cable', 'Case', 'Mouse', 'Keyboard']},
			{key: 'Connectivity', label: 'Connectivity', options: ['Bluetooth', 'Wired', 'USB-C', 'Lightning']},
		],
	},
};

// fallback nếu slug không có trong config
export const DEFAULT_FILTER_CONFIG = {
	brand: null,
	categories: null,
	attributes: [],
};

export const getFilterConfig = (slug) => {
	if (!slug) return {brand: null, attributes: []};
	if (FILTER_CONFIGS[slug]) return FILTER_CONFIGS[slug];
	const key = Object.keys(FILTER_CONFIGS).find((k) => slug.includes(k));
	return key ? FILTER_CONFIGS[key] : {brand: null, attributes: []};
};
