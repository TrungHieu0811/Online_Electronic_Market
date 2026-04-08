// src/config/filterConfigs.js

export const FILTER_CONFIGS = {
	mobile: {
		label: 'Điện thoại',
		attributes: [
			{
				key: 'Storage',
				label: 'Dung lượng',
				type: 'checkbox',
				options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
			},
			{
				key: 'RAM',
				label: 'RAM',
				type: 'checkbox',
				options: ['4GB', '6GB', '8GB', '12GB', '16GB'],
			},
			{
				key: 'Display',
				label: 'Màn hình',
				type: 'checkbox',
				options: ['OLED', 'AMOLED', 'LCD', 'Retina'],
			},
			{
				key: 'OS',
				label: 'Hệ điều hành',
				type: 'checkbox',
				options: ['iOS', 'Android'],
			},
			{
				key: 'Battery',
				label: 'Pin',
				type: 'checkbox',
				options: ['3000mAh', '4000mAh', '5000mAh', '6000mAh'],
			},
		],
	},
	laptop: {
		label: 'Laptop',
		attributes: [
			{
				key: 'RAM',
				label: 'RAM',
				type: 'checkbox',
				options: ['8GB', '16GB', '32GB', '64GB'],
			},
			{
				key: 'Storage',
				label: 'Ổ cứng',
				type: 'checkbox',
				options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
			},
			{
				key: 'Processor',
				label: 'CPU',
				type: 'checkbox',
				options: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2', 'Apple M3'],
			},
			{
				key: 'Display',
				label: 'Màn hình',
				type: 'checkbox',
				options: ['13 inch', '14 inch', '15.6 inch', '16 inch', '17 inch'],
			},
			{
				key: 'Graphics',
				label: 'Card đồ hoạ',
				type: 'checkbox',
				options: ['Intel Iris Xe', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'AMD Radeon'],
			},
			{
				key: 'Battery',
				label: 'Pin',
				type: 'checkbox',
				options: ['Up to 8 hours', 'Up to 12 hours', 'Up to 16 hours', 'Up to 20 hours'],
			},
		],
	},
	tablet: {
		label: 'Máy tính bảng',
		attributes: [
			{
				key: 'Storage',
				label: 'Dung lượng',
				type: 'checkbox',
				options: ['64GB', '128GB', '256GB', '512GB'],
			},
			{
				key: 'RAM',
				label: 'RAM',
				type: 'checkbox',
				options: ['4GB', '6GB', '8GB', '12GB'],
			},
			{
				key: 'Display',
				label: 'Màn hình',
				type: 'checkbox',
				options: ['8 inch', '10 inch', '11 inch', '12.9 inch'],
			},
			{
				key: 'OS',
				label: 'Hệ điều hành',
				type: 'checkbox',
				options: ['iPadOS', 'Android'],
			},
			{
				key: 'Connectivity',
				label: 'Kết nối',
				type: 'checkbox',
				options: ['WiFi', 'WiFi + 4G', 'WiFi + 5G'],
			},
		],
	},
	accessories: {
		label: 'Phụ kiện',
		attributes: [
			{
				key: 'Type',
				label: 'Loại',
				type: 'checkbox',
				options: ['Tai nghe', 'Sạc', 'Cáp', 'Ốp lưng', 'Chuột', 'Bàn phím'],
			},
			{
				key: 'Connectivity',
				label: 'Kết nối',
				type: 'checkbox',
				options: ['Bluetooth', 'Wired', 'USB-C', 'Lightning'],
			},
		],
	},
	// thêm category mới ở đây
};

// fallback nếu slug không có trong config
export const DEFAULT_FILTER_CONFIG = {
	attributes: [],
};

export function getFilterConfig(slug) {
	// tìm theo slug chính xác hoặc slug chứa keyword
	if (FILTER_CONFIGS[slug]) return FILTER_CONFIGS[slug];
	const key = Object.keys(FILTER_CONFIGS).find((k) => slug?.includes(k));
	return key ? FILTER_CONFIGS[key] : DEFAULT_FILTER_CONFIG;
}
