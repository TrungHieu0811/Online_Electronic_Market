import React, {useState, useEffect} from 'react';
import api from '@/services/api';
import {useParams} from 'react-router-dom';

export default function TestCateConfigManagementPage() {
	const {slug} = useParams();
	const [config, setConfig] = useState(null);
	const [status, setStatus] = useState('');

	useEffect(() => {
		api.get(`/public/categories/${slug}/filter-config`).then((res) => {
			const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
			setConfig(data);
		});
	}, [slug]);

	// Cập nhật giá trị options dưới dạng chuỗi phân cách dấu phẩy
	const handleAttrChange = (index, field, value) => {
		const newAttributes = [...config.attributes];
		if (field === 'options') {
			// Chuyển chuỗi "8GB, 16GB" thành mảng ["8GB", "16GB"]
			newAttributes[index][field] = value.split(',').map((item) => item.trim());
		} else {
			newAttributes[index][field] = value;
		}
		setConfig({...config, attributes: newAttributes});
	};

	const addAttribute = () => {
		const newAttr = {key: '', label: '', options: []};
		setConfig({...config, attributes: [...config.attributes, newAttr]});
	};

	const removeAttribute = (index) => {
		const newAttributes = config.attributes.filter((_, i) => i !== index);
		setConfig({...config, attributes: newAttributes});
	};

	const handleSave = async () => {
		try {
			var res = await api.put(`/admin/filter-configs/${slug}`, JSON.stringify(config), {
				headers: {'Content-Type': 'application/json'},
			});
			console.log('res:', res);
			setStatus('Cập nhật thành công!');
			setTimeout(() => setStatus(''), 3000);
		} catch (e) {
			console.error('Full Error Object:', e); // Log để bạn kiểm tra cấu trúc lỗi

			// 1. Lấy thông báo chi tiết từ Server (nếu có)
			const serverMessage = e.response?.data?.message || e.response?.data || '';

			// 2. Phân loại lỗi để hiển thị cụ thể
			if (e.response?.status === 403) {
				setStatus(`❌ Quyền truy cập bị từ chối (403): Tài khoản của bạn không có quyền Admin để thực hiện thao tác này.`);
			} else if (e.response?.status === 401) {
				setStatus(`❌ Lỗi xác thực (401): Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ. Vui lòng đăng nhập lại.`);
			} else if (e.response?.status === 400) {
				setStatus(`❌ Dữ liệu không hợp lệ (400): ${serverMessage}`);
			} else if (e.message === 'Network Error') {
				setStatus(`❌ Lỗi kết nối: Không thể kết nối tới Server. Vui lòng kiểm tra lại mạng hoặc Server Java.`);
			} else {
				// Hiển thị lỗi bất kỳ khác kèm thông báo từ server
				setStatus(`❌ Có lỗi xảy ra: ${serverMessage || e.message}`);
			}
		}
	};

	if (!config) return <div className="p-6">Đang tải cấu hình...</div>;

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
				<div className="flex justify-between items-center mb-6 border-b pb-4">
					<h2 className="text-2xl font-bold text-gray-800">
						Cấu hình Filter: <span className="text-blue-600">{slug}</span>
					</h2>
					<button
						onClick={handleSave}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
					>
						Lưu tất cả thay đổi
					</button>
				</div>

				{status && (
					<div
						className={`mb-4 p-3 rounded-lg text-center font-medium ${status.includes('Lỗi') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
					>
						{status}
					</div>
				)}

				<div className="space-y-6">
					{config.attributes.map((attr, index) => (
						<div key={index} className="p-4 border rounded-xl bg-gray-50 relative group">
							<button
								onClick={() => removeAttribute(index)}
								className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								Xóa
							</button>
							<div className="grid grid-cols-2 gap-4 mb-3">
								<div>
									<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Key (VD: Storage)</label>
									<input
										type="text"
										value={attr.key}
										onChange={(e) => handleAttrChange(index, 'key', e.target.value)}
										className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
									/>
								</div>
								<div>
									<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nhãn hiển thị (VD: Dung lượng)</label>
									<input
										type="text"
										value={attr.label}
										onChange={(e) => handleAttrChange(index, 'label', e.target.value)}
										className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
									/>
								</div>
							</div>
							<div>
								<label className="block text-xs font-bold text-gray-500 uppercase mb-1">
									Danh sách giá trị (cách nhau bởi dấu phẩy)
								</label>
								<input
									type="text"
									value={attr.options.join(', ')}
									onChange={(e) => handleAttrChange(index, 'options', e.target.value)}
									placeholder="8GB, 16GB, 32GB..."
									className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
								/>
							</div>
						</div>
					))}
				</div>

				<button
					onClick={addAttribute}
					className="mt-6 w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold"
				>
					+ Thêm thuộc tính lọc mới
				</button>
				<button
					onClick={handleSave}
					className="bg-green-600 hover:bg-green-700 text-white mt-6 w-full px-6 py-3 rounded-lg font-medium transition-colors"
				>
					Lưu tất cả thay đổi
				</button>
			</div>
		</div>
	);
}
