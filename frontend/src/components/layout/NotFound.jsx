import React from 'react';
import {Link} from 'react-router-dom';

const NotFound = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
			{/* Số 404 lớn */}

			{/* Thông báo */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
				<h1 className="text-9xl font-black text-gray-300">404</h1>
				<h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Ối! Trang không tồn tại</h2>
				<p className="text-gray-500 mb-8 max-w-md mx-auto">
					Có vẻ như đường dẫn bạn truy cập đã bị lỗi hoặc không còn tồn tại trong hệ thống của Electro Mart.
				</p>

				{/* Nút quay về trang chủ */}
				<Link
					to="/"
					className="inline-block bg-[#045fae] hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
				>
					Quay lại Trang Chủ
				</Link>
			</div>

			{/* Trang trí thêm (tùy chọn) */}
			{/* <div className="mt-12 text-gray-300">
				<svg className="mx-auto w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1"
						d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div> */}
		</div>
	);
};

export default NotFound;
