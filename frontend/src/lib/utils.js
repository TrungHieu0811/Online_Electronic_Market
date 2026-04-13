import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
const slugify = (text) => {
	return text
		.toString()
		.toLowerCase()
		.normalize('NFD') // Chuyển về dạng không dấu
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.replace(/\s+/g, '-') // Thay khoảng trắng bằng -
		.replace(/[^\w-]+/g, '') // Xóa ký tự đặc biệt
		.replace(/--+/g, '-'); // Thay -- thành -
};

export {slugify};
