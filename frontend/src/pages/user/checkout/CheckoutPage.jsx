import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {checkoutService} from '@/services/checkoutService';
import {PiShippingContainerFill} from 'react-icons/pi';
import {RiPaypalFill} from 'react-icons/ri';
import {paymentService} from '@/services/paymentService';

const CheckoutPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const IMAGE_BASE_URL = 'http://localhost:8080/uploads';

	// 1. Quản lý danh sách sản phẩm được chọn từ Cart
	const [checkoutItems, setCheckoutItems] = useState([]);

	// 2. State quản lý hình thức nhập liệu & Form
	const [useProfileInfo, setUseProfileInfo] = useState(true);
	const [formData, setFormData] = useState({
		fullName: '',
		phone: '',
		email: '',
		address: '',
	});

	const [errors, setErrors] = useState({
		fullName: '',
		email: '',
		phone: '',
		address: ''
	});

	// 3. State địa chỉ GHN và phí ship
	const [provinces, setProvinces] = useState([]);
	const [districts, setDistricts] = useState([]);
	const [wards, setWards] = useState([]);
	const [selectedAddress, setSelectedAddress] = useState({
		provinceId: '',
		districtId: '',
		wardCode: '',
	});
	const [distance, setDistance] = useState(0);

	//Payment mặc định COD
	const [paymentMethod, setPaymentMethod] = useState('COD');

	const [shippingFee, setShippingFee] = useState(0);
	const [loadingFee, setLoadingFee] = useState(false);

	const GHN_TOKEN = '7929ef18-3653-11f1-a973-aee5264794df'.replace(/[\\"]/g, '').trim();

	// Khởi tạo: Lấy sản phẩm được chọn từ localStorage
	useEffect(() => {
		const buyNowData = location.state;

		if (buyNowData && buyNowData.isBuyNow) {
			// Nếu là Buy Now, dùng dữ liệu từ state
			setCheckoutItems(buyNowData.items || []);
			console.log('buynowData: ', buyNowData.items);
		} else {
			// 2. Nếu không phải Buy Now, mới kiểm tra localStorage (đơn hàng từ Cart)
			const savedItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');

			if (savedItems.length === 0) {
				// Chỉ quay về Cart nếu cả 2 nguồn đều không có dữ liệu
				navigate('/cart');
				return;
			}
			console.log('cartData: ', savedItems);
			setCheckoutItems(savedItems);
		}
	}, [location.state, navigate]);
	console.log('buy now data', location.state);

	// Tự động điền thông tin User từ localStorage
	useEffect(() => {
		const fetchUserProfile = async () => {
			// Chỉ gọi API nếu người dùng chọn "Use my profile information"
			if (useProfileInfo) {
				try {
					const userToken = localStorage.getItem('token');
					if (!userToken) return;

					// Gọi đến endpoint /me
					const response = await axios.get('http://localhost:8080/api/users/me', {
						headers: {
							Authorization: `Bearer ${userToken}`,
						},
					});

					const profile = response.data;

					// Điền dữ liệu vào form
					setFormData({
						fullName: profile.fullName || '',
						phone: profile.phone || '',
						email: profile.email || '',
						address: profile.address || '',
					});
					setErrors({ fullName: '', email: '', phone: '', address: '' });
				} catch (error) {
					Swal.fire('Error', 'Could not load your profile information. Please enter manually.', 'error');
				}
			} else {
				setFormData({fullName: '', phone: '', email: '', address: ''});
			}
		};
		fetchUserProfile();
	}, [useProfileInfo]);

	// Lấy danh sách Tỉnh/Thành từ GHN API

	//COUPON
	const [couponCode, setCouponCode] = useState('');
	const [discountAmount, setDiscountAmount] = useState(0);
	const [availableCoupons, setAvailableCoupons] = useState([]);
	const [showCouponList, setShowCouponList] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState(null);

	// const subtotal = checkoutItems.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
	const subtotal = checkoutItems.reduce((sum, item) => {
		// Lấy giá: Ưu tiên item.product.salePrice (Giỏ hàng),
		// nếu không có thì lấy item.price (Buy Now)
		const price = item.product?.salePrice ?? item.price ?? 0;
		return sum + price * item.quantity;
	}, 0);

	// Effect: Lấy danh sách coupon khả dụng (Backend đã lọc UserLimit và Sort từ nhiều đến ít)
	useEffect(() => {
		const fetchCoupons = async () => {
			try {
				const token = localStorage.getItem('token');
				if (!token) return;

				const res = await axios.get(`http://localhost:8080/api/users/coupons/available?orderValue=${subtotal}`, {
					headers: {Authorization: `Bearer ${token}`},
				});
				setAvailableCoupons(res.data);
			} catch (err) {
				console.error('Lỗi lấy danh sách coupon khả dụng', err);
			}
		};
		if (subtotal > 0) fetchCoupons();
	}, [subtotal]);

	// Hàm thực thi áp dụng coupon vào đơn hàng
	const applyCoupon = (coupon) => {
		setSelectedCoupon(coupon);
		setCouponCode(coupon.code);

		let discount = 0;
		if (coupon.discountType === 'PERCENTAGE') {
			discount = (subtotal * coupon.discountValue) / 100;
			if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
				discount = coupon.maxDiscountAmount;
			}
		} else {
			discount = coupon.discountValue;
		}

		setDiscountAmount(discount);
		setShowCouponList(false);
		// Swal.fire({
		//     icon: 'success',
		//     title: 'Coupon Applied!',
		//     text: `You saved $${discount.toFixed(2)}`,
		//     timer: 1500,
		//     showConfirmButton: false
		// });
	};

	// Hàm xử lý khi người dùng nhấn nút APPLY (nhập mã tay)
	const handleManualApply = () => {
		if (!couponCode.trim()) return;

		// Tìm mã trong danh sách khả dụng (đã được backend validate mọi điều kiện)
		const found = availableCoupons.find((c) => c.code === couponCode.toUpperCase());

		if (found) {
			applyCoupon(found);
		} else {
			setDiscountAmount(0);
			setSelectedCoupon(null);
			Swal.fire('Invalid Code', 'This coupon is not available for your account or order value.', 'error');
		}
	};

	useEffect(() => {
		const fetchProvinces = async () => {
			try {
				const res = await axios.get('http://localhost:8080/api/users/orders/provinces', {
					headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
				});

				// Dữ liệu từ Java trả về thường bọc trong field 'data' của GHN
				if (res.data && res.data.data) {
					// Lọc bỏ những tỉnh có tên chứa chữ "Test" hoặc các tên lạ
					const cleanProvinces = res.data.data.filter(
						(p) => !p.ProvinceName.includes('Test') && !p.ProvinceName.includes('Hà Nội 02'),
					);
					setProvinces(cleanProvinces);
				}
			} catch (err) {
				console.error('Lỗi lấy tỉnh thành từ Backend:', err);
			}
		};
		fetchProvinces();
	}, []);
	const handleProvinceChange = async (e) => {
		const pId = e.target.value;
		setSelectedAddress({provinceId: pId, districtId: '', wardCode: ''});
		setDistricts([]);
		setWards([]);
		setShippingFee(0);

		try {
			const res = await axios.get(
				`https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${pId}`,
				{
					headers: {'Token': GHN_TOKEN},
				},
			);
			setDistricts(res.data.data);
		} catch (err) {
			console.error(err);
		}
	};

	const handleDistrictChange = async (e) => {
		const dId = e.target.value;
		setSelectedAddress((prev) => ({...prev, districtId: dId, wardCode: ''}));
		setWards([]);
		setShippingFee(0);

		try {
			const res = await axios.get(
				`https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${dId}`,
				{
					headers: {'Token': GHN_TOKEN},
				},
			);
			setWards(res.data.data);
		} catch (err) {
			console.error(err);
		}
	};

	const handleWardChange = async (e) => {
		const wCode = e.target.value;
		if (!wCode) return;

		setSelectedAddress((prev) => ({...prev, wardCode: wCode}));
		setLoadingFee(true);

		try {
			// const currentSubtotal = checkoutItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);

			// Dùng selectedAddress.districtId hiện có trong state
			const [fee, dist] = await Promise.all([
            checkoutService.previewShippingFee(selectedAddress.districtId, wCode, subtotal),
            checkoutService.getShippingDistance(selectedAddress.provinceId,selectedAddress.districtId, wCode)
        ]);
			console.log('Tiền ship:', fee, 'Khoảng cách:', dist);
			setShippingFee(typeof fee === 'number' ? fee : 0);
			setDistance(dist || 0);
			// setShippingFee(fee);
		} catch (err) {
			console.error('Lỗi tính phí ship:', err);
			setShippingFee(0);
			setDistance(0);
		} finally {
			setLoadingFee(false);
		}
	};

	const validateVietnamesePhone = (phone) => {
		const vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
		return vnf_regex.test(phone);
	};

	const validateEmail = (email) => {
		return String(email)
			.toLowerCase()
			.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
	};

	const handleFullNameChange = (e) => {
  const value = e.target.value;
  setFormData({ ...formData, fullName: value });
  if (!value.trim()) {
    setErrors(prev => ({ ...prev, fullName: 'Full name cannot be empty' }));
  } else {
    setErrors(prev => ({ ...prev, fullName: '' }));
  }
};

const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    
    if (!value) {
        setErrors(prev => ({ ...prev, email: 'Email cannot be empty' }));
    } else if (!validateEmail(value)) { 
        setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
    } else {
        setErrors(prev => ({ ...prev, email: '' }));
    }
};

const handlePhoneChange = (e) => {
    // Chỉ lấy số và giới hạn 10 ký tự
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
    
    if (!value) {
        setErrors(prev => ({ ...prev, phone: 'Phone number cannot be empty' }));
    } else if (!validateVietnamesePhone(value)) { 
        setErrors(prev => ({ ...prev, phone: 'Invalid VN phone (10 digits)' }));
    } else {
        setErrors(prev => ({ ...prev, phone: '' }));
    }
};

const handleAddressChange = (e) => {
  const value = e.target.value;
  setFormData({ ...formData, address: value });
  if (!value.trim()) {
    setErrors(prev => ({ ...prev, address: 'Street address cannot be empty' }));
  } else {
    setErrors(prev => ({ ...prev, address: '' }));
  }
};

	const handlePlaceOrder = async (e) => {
		e.preventDefault();

		// Validate tổng lực trước khi submit
    const finalErrors = {
      fullName: !formData.fullName.trim() ? 'Full name is required' : '',
      email: !formData.email ? 'Email is required' : (!validateEmail(formData.email) ? 'Invalid email format' : ''),
      phone: !formData.phone ? 'Phone is required' : (!validateVietnamesePhone(formData.phone) ? 'Invalid VN phone (10 digits)' : ''),
      address: !formData.address.trim() ? 'Address is required' : ''
    };

    setErrors(finalErrors);

    // Kiểm tra xem có lỗi nào không
    if (Object.values(finalErrors).some(err => err !== '')) {
      Swal.fire('Warning', 'Please correct the errors in the form!', 'warning');
      return;
    }

    if (!selectedAddress.wardCode) {
      Swal.fire('Warning', 'Please select a complete shipping area!', 'warning');
      return;
    }
		const orderRequest = {
			shipName: formData.fullName.trim(),
			shipPhone: formData.phone,
			shipAddress: `${formData.address}, ${wards.find((w) => w.WardCode === selectedAddress.wardCode)?.WardName}`,
			districtId: parseInt(selectedAddress.districtId),
			wardCode: selectedAddress.wardCode,
			paymentMethod: paymentMethod, // 'COD' hoặc 'PAYPAL'
			selectedCartItemIds: checkoutItems.map((item) => item.id),
			couponCode: selectedCoupon ? selectedCoupon.code : null,
		};

		try {
			// SỬ DỤNG SERVICE ĐỂ GỌI API ĐẶT HÀNG
			// await checkoutService.placeOrder(orderRequest);

			// localStorage.removeItem('checkoutItems');
			let orderResponse;

			// 2. KIỂM TRA NGUỒN GỐC ĐƠN HÀNG
			// Logic Buy Now chỉ chạy nếu location.state có cờ isBuyNow từ ProductDetail truyền sang
			if (location.state?.isBuyNow && location.state?.items?.length > 0) {
				const item = location.state.items[0];

				// Gọi API buyNow: Truyền productId, quantity vào Params và orderRequest vào Body
				orderResponse = await checkoutService.buyNow(item.productId, item.quantity, orderRequest);
			} else {
				// Trường hợp mặc định: Đặt hàng từ danh sách sản phẩm trong giỏ hàng
				orderResponse = await checkoutService.placeOrder(orderRequest);
			}

			// 3. Xử lý sau thành công

			// Thử lấy ID từ nhiều vị trí khác nhau để đảm bảo không bị undefined
			const orderId =
				orderResponse.data?.id || orderResponse.id || (typeof orderResponse.data === 'number' ? orderResponse.data : null);

			console.log('Dữ liệu nhận được từ Server:', orderResponse.data); // Log để debug nếu vẫn lỗi

			if (!orderId) {
				throw new Error('Order created but server returned no ID.');
			}

			// BƯỚC 2: Xử lý thanh toán dựa trên phương thức đã chọn
			if (paymentMethod === 'PAYPAL') {
				const paymentData = await paymentService.createPayment(orderId, 'PAYPAL');

				if (paymentData.paymentUrl) {
					localStorage.removeItem('checkoutItems');
					// Chuyển hướng sang trang PayPal
					window.location.href = paymentData.paymentUrl;
				} else {
					throw new Error('Could not generate PayPal payment link.');
				}
			} else {
				// Trường hợp COD (Giao hàng trả tiền mặt)
				await paymentService.createPayment(orderId, 'COD');

				localStorage.removeItem('checkoutItems');

				if (!location.state?.isBuyNow) {
					localStorage.removeItem('checkoutItems'); // Chỉ xóa cache giỏ hàng nếu không phải Buy Now
				}
				await Swal.fire({
					icon: 'success',
					title: 'Order Placed!',
					text: 'Your order has been recorded successfully.',
					timer: 2000,
				});
				navigate('/profile/orders');
			}
		} catch (err) {
			console.error('Order Error:', err);
			const errorMsg = err.response?.data?.message || err.response?.data || err.message;
			Swal.fire('Order Failed', errorMsg, 'error');

			// Rollback coupon nếu có lỗi xảy ra giữa chừng (như code cũ của bạn)
			if (couponCode) {
				await couponService.rollbackCoupon(couponCode);
			}
		}
	};

	// const subtotal = checkoutItems.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
	const tax = subtotal * 0.1;

	// Đảm bảo shippingFee luôn là số, nếu lỗi thì mặc định là 0
	const safeShippingFee = Number(shippingFee) || 0;
	const finalTotal = subtotal + tax + safeShippingFee - discountAmount;

	return (
		<div className="min-h-screen bg-slate-50 py-12 font-sans">
			<div className="container mx-auto px-4">
				{/* Bọc toàn bộ trang Checkout trong một Form để đảm bảo đồng bộ */}
				<form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8 items-start">
					{/* CỘT TRÁI: THÔNG TIN VẬN CHUYỂN */}
					<div className="flex-1 w-full space-y-6">
						<h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Complete Your Order</h2>

						{/* Delivery Option */}
						<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
							<label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Delivery Option</label>
							<select
								value={useProfileInfo}
								onChange={(e) => setUseProfileInfo(e.target.value === 'true')}
								className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
							>
								<option value="true">Use My Profile Information</option>
								<option value="false">Ship To a Different Address</option>
							</select>
						</div>

						{/* Receiver Details */}
						<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
							<h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
								<span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
								Shipping Information
							</h3>
							<div className="space-y-4">
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-400 ml-1">FULL NAME</label>
									<input
										value={formData.fullName}
										onChange={handleFullNameChange}
										className={`border ${errors.fullName ? 'border-red-500' : 'border-slate-200'} p-4 rounded-xl w-full outline-none transition-all`}
										placeholder="Enter full name"
									/>
									{errors.fullName && <p className="text-red-500 text-[10px] ml-2 italic">*{errors.fullName}</p>}
								</div>

								{/* Email */}
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Email Address</label>
									<input
										type="email"
										value={formData.email}
										onChange={handleEmailChange}
										className={`border ${errors.email ? 'border-red-500' : 'border-slate-200'} p-4 rounded-xl w-full outline-none transition-all`}
										placeholder="example@email.com"
									/>
									{errors.email && <p className="text-red-500 text-[10px] ml-2 italic">*{errors.email}</p>}
								</div>

								{/* Phone */}
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-400 ml-1">PHONE NUMBER</label>
									<input
										type="text"
										value={formData.phone}
										onChange={handlePhoneChange}
										className={`border ${errors.phone ? 'border-red-500' : 'border-slate-200'} p-4 rounded-xl w-full outline-none transition-all`}
										placeholder="0xxx xxx xxx"
									/>
									{errors.phone && <p className="text-red-500 text-[10px] ml-2 italic">*{errors.phone}</p>}
								</div>
							</div>
						</div>

						{/* Shipping Area */}
						<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
							<h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
								<span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
								Shipping Area
							</h3>
							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-400 ml-1">STREET ADDRESS</label>
								<input
									value={formData.address}
									onChange={handleAddressChange}
									className={`border ${errors.address ? 'border-red-500' : 'border-slate-200'} p-4 rounded-xl w-full outline-none transition-all`}
									placeholder="House number, Street name..."
								/>
								{errors.address && <p className="text-red-500 text-[10px] ml-2 italic">*{errors.address}</p>}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<select onChange={handleProvinceChange} value={selectedAddress.provinceId} className="...">
									<option value="">Select Province</option>
									{/* Thêm kiểm tra provinces tồn tại và là mảng */}
									{Array.isArray(provinces) &&
										provinces.map((p) => (
											<option key={p.ProvinceID} value={p.ProvinceID}>
												{p.ProvinceName}
											</option>
										))}
								</select>
								<select
									onChange={handleDistrictChange}
									value={selectedAddress.districtId}
									disabled={!selectedAddress.provinceId}
									className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
									required
								>
									<option value="">Select District</option>
									{districts.map((d) => (
										<option key={d.DistrictID} value={d.DistrictID}>
											{d.DistrictName}
										</option>
									))}
								</select>
								<select
									onChange={handleWardChange}
									value={selectedAddress.wardCode}
									disabled={!selectedAddress.districtId}
									className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
									required
								>
									<option value="">Select Ward</option>
									{wards.map((w) => (
										<option key={w.WardCode} value={w.WardCode}>
											{w.WardName}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* CỘT PHẢI: ORDER SUMMARY (STICKY) */}

					<div className="w-full lg:w-[400px] lg:sticky lg:top-12">
						<div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800">
							<h3 className="text-xl font-bold mb-6 border-b border-slate-800 pb-4 text-center">Order Summary</h3>

							{/* Product List */}
							<div className="max-h-64 overflow-y-auto mb-6 space-y-3 pr-2 custom-scrollbar">
								{checkoutItems.map((item) => (
									<div key={item.id || item.productId} className="flex items-center gap-4 group">
										<div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 p-0 group-hover:scale-105 transition-transform overflow-hidden border border-slate-700">
											<img
												src={item.imageUrl?.startsWith('http') ? item.imageUrl : `${IMAGE_BASE_URL + item.imageUrl}`}
												alt={item.product?.variantName}
												className="w-full h-full object-contain"
											/>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-bold truncate text-slate-100 uppercase tracking-tight">
												{item.product?.variantName}
											</p>
											<p className="text-[10px] text-slate-400 mt-0.5 font-medium">Quantity: {item.quantity}</p>
										</div>
										<p className="text-sm font-black text-slate-100">${(item.product?.salePrice * item.quantity).toFixed(2)}</p>
									</div>
								))}
							</div>

							{/* Coupon Section */}
							<div className="mt-6 mb-6 pt-6 border-t border-slate-800 relative">
								<label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Promo Code</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={couponCode}
										onChange={(e) => setCouponCode(e.target.value.toUpperCase())} // Sửa lỗi không nhập được
										className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
										placeholder="Enter code"
									/>
									<button
										type="button"
										onClick={handleManualApply}
										className="bg-orange-600 px-4 py-3 rounded-xl font-bold text-xs"
									>
										APPLY
									</button>
								</div>

								{/* HIỂN THỊ MÃ ĐANG DÙNG */}
								{selectedCoupon && (
									<div className="mt-2 flex items-center justify-between bg-orange-500/10 border border-orange-500/30 p-2 rounded-lg">
										<p className="text-[10px] text-orange-500 font-bold">Using: {selectedCoupon.code}</p>
										<button
											type="button"
											onClick={() => {
												setSelectedCoupon(null);
												setDiscountAmount(0);
												setCouponCode('');
											}}
											className="text-[10px] text-red-400 underline"
										>
											Remove
										</button>
									</div>
								)}

								<button
									type="button"
									onClick={() => setShowCouponList(!showCouponList)}
									className="text-orange-400 text-[10px] mt-2 underline font-bold"
								>
									{showCouponList ? '✕ Close List' : 'View available coupons'}
								</button>

								{showCouponList && (
									<div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-2">
										{availableCoupons.map((c) => (
											<div
												key={c.id}
												onClick={() => applyCoupon(c)}
												className="p-3 hover:bg-slate-700 rounded-xl cursor-pointer flex justify-between items-center group"
											>
												<div>
													<p className="text-orange-500 font-bold text-xs">{c.code}</p>
													<p className="text-[9px] text-slate-400">{c.description}</p>
												</div>
												<span className="text-[10px] font-bold text-white">
													-{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
												</span>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Totals */}
							<div className="space-y-4 text-sm pt-4">
								<div className="flex justify-between text-slate-400">
									<span>Subtotal</span>
									<span className="text-white font-bold">${subtotal.toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-slate-400">
										<span>Distance</span>
										<span className="text-white font-bold">
												{/* distance nhận từ GHN thường là đơn vị mét (m) */}
												{distance > 0 ? `${(distance / 1000).toFixed(1)} km` : '---'}
												{/* {distance > 0 ? `${distance.toLocaleString()} m` : '---'} */}
										</span>
								</div>
								<div className="flex justify-between text-slate-400">
									<span>Shipping</span>
									<span className="text-blue-400 font-bold">
										{loadingFee ? (
											<span className="animate-pulse">Calculating...</span>
										) : (
											<span>${shippingFee === 0 ? 'FREE' : `${shippingFee.toFixed(2)}`}</span>
											// <span>${shippingFee === 0 ? 'FREE' : console.log(shippingFee)}</span>
											// <span>$777</span>
										)}
									</span>
								</div>
								{discountAmount > 0 && (
									<div className="flex justify-between text-green-400">
										<span>Coupon Discount</span>
										<span>-${discountAmount.toFixed(2)}</span>
									</div>
								)}
								<div className="flex justify-between border-b border-slate-800 pb-6 text-slate-400">
									<span>Tax (10%)</span>
									<span className="text-white font-bold">${tax.toFixed(2)}</span>
								</div>
								<div className="flex justify-between items-end pt-3">
									<span className="text-slate-200 font-bold uppercase tracking-wider text-xs">Total Amount</span>
									<span className="text-4xl font-black text-orange-500">${finalTotal.toFixed(2)}</span>
								</div>
							</div>

							{/* Payment Methods Badges */}
							<div className="mt-4 border-t border-slate-800 pt-4">
								<p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
									Supported Payment Methods
								</p>
								<div className="flex justify-center items-center gap-3">
									{/* Badge COD */}

									{/* Badge COD */}
									<div
										onClick={() => setPaymentMethod('COD')}
										className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${
											paymentMethod === 'COD' ? 'bg-orange-500 border-orange-500 shadow-lg' : 'bg-slate-800/50 border-slate-700'
										}`}
									>
										<PiShippingContainerFill className={paymentMethod === 'COD' ? 'text-white' : 'text-orange-400'} />
										<span className={`text-[10px] font-bold ${paymentMethod === 'COD' ? 'text-white' : 'text-slate-300'}`}>
											COD
										</span>
									</div>

									{/* Badge PAYPAL */}
									<div
										onClick={() => setPaymentMethod('PAYPAL')}
										className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${
											paymentMethod === 'PAYPAL' ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-slate-800/50 border-slate-700'
										}`}
									>
										<RiPaypalFill className={paymentMethod === 'PAYPAL' ? 'text-white' : 'text-[#003087]'} />
										<span className={`text-[10px] font-bold ${paymentMethod === 'PAYPAL' ? 'text-white' : 'text-slate-300'}`}>
											PAYPAL
										</span>
									</div>
								</div>
							</div>

							{/* Thông báo mua thêm để Free Ship */}
							{subtotal >= 1400 && subtotal < 1500 && (
								<div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-pulse">
									<p className="text-[11px] text-blue-400 font-medium text-center">
										Your order is <strong>${subtotal.toFixed(2)}</strong>. 
										Add <strong>${(1500 - subtotal).toFixed(2)}</strong> more to get 
										<span className="text-blue-300 font-bold"> FREE SHIPPING!</span>
									</p>
									<button 
										type="button"
										onClick={() => navigate('/cart')}
										className="w-full mt-2 text-[10px] font-bold text-blue-400 underline hover:text-blue-300"
									>
										Return to Cart to add more items
									</button>
								</div>
							)}

							{/* Nếu đã đạt ngưỡng Free Ship */}
							{subtotal >= 1500 && (
								<div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
									<p className="text-[11px] text-emerald-400 font-bold text-center flex items-center justify-center gap-2">
										<span>🎉</span> YOU'VE UNLOCKED FREE SHIPPING!
									</p>
								</div>
							)}

							{/* Submit Button */}
							<button
								type="submit"
								className="w-full mt-6 bg-orange-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-orange-700 shadow-xl shadow-orange-900/20 transition-all transform active:scale-[0.98]"
							>
								Confirm Order
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CheckoutPage;
