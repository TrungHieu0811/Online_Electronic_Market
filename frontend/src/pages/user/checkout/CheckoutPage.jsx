import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { checkoutService } from '@/services/checkoutService';
import { PiShippingContainerFill } from "react-icons/pi";
import { RiPaypalFill } from "react-icons/ri";

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Quản lý danh sách sản phẩm được chọn từ Cart
    const [checkoutItems, setCheckoutItems] = useState([]);
    
    // 2. State quản lý hình thức nhập liệu & Form
    const [useProfileInfo, setUseProfileInfo] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: ''
    });

    // 3. State địa chỉ GHN và phí ship
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState({
        provinceId: '', districtId: '', wardCode: ''
    });

    //COUPON
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0); // Số tiền giảm giá 
    const [couponError, setCouponError] = useState(''); // Thông báo lỗi nếu mã sai

    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);

    const GHN_TOKEN = '7929ef18-3653-11f1-a973-aee5264794df'.replace(/[\\"]/g, '').trim();

    // Khởi tạo: Lấy sản phẩm được chọn từ localStorage
    useEffect(() => {
       const buyNowData = location.state;

        if (buyNowData && buyNowData.isBuyNow) {
            // Nếu là Buy Now, dùng dữ liệu từ state
            setCheckoutItems(buyNowData.items || []);
        } else {
            // 2. Nếu không phải Buy Now, mới kiểm tra localStorage (đơn hàng từ Cart)
            const savedItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
            
            if (savedItems.length === 0) {
                // Chỉ quay về Cart nếu cả 2 nguồn đều không có dữ liệu
                navigate('/cart');
                return;
            }
            setCheckoutItems(savedItems);
        }
    }, [location.state, navigate]);

    // Tự động điền thông tin User từ localStorage
    useEffect(() => {
        const fetchUserProfile = async () => {
            // Chỉ gọi API nếu người dùng chọn "Use my profile information"
            if (useProfileInfo) {
                try {
                    const userToken = localStorage.getItem('token');
                    if (!userToken) return;

                    // Gọi đến endpoint /me
                    const response = await axios.get("http://localhost:8080/api/users/me", {
                        headers: {
                            Authorization: `Bearer ${userToken}`
                        }
                    });
                    
                    const profile = response.data;

                    // Điền dữ liệu vào form
                    setFormData({
                        fullName: profile.fullName || '',
                        phone: profile.phone || '',
                        address: profile.address || ''
                    });
                } catch (error) {
                    Swal.fire('Error', 'Could not load your profile information. Please enter manually.', 'error');
                }
            } else {
                setFormData({ fullName: '', phone: '', address: '' });
            }
        };
        fetchUserProfile();
    }, [useProfileInfo]);

    // Lấy danh sách Tỉnh/Thành từ GHN API

    const handleApplyCoupon = () => {
        // NGƯỜI LÀM COUPON SẼ VIẾT LOGIC GỌI API Ở ĐÂY
        console.log("Applying coupon:", couponCode);
        
        // Ví dụ sau này họ gọi Service:
        // checkoutService.validateCoupon(couponCode, subtotal).then(res => { ... })
    };

  useEffect(() => {
    const fetchProvinces = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/users/orders/provinces", {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
            
            // Dữ liệu từ Java trả về thường bọc trong field 'data' của GHN
            if (res.data && res.data.data) {
                setProvinces(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi lấy tỉnh thành từ Backend:", err);
        }
    };
    fetchProvinces();
}, []);
    const handleProvinceChange = async (e) => {
        const pId = e.target.value;
        setSelectedAddress({ provinceId: pId, districtId: '', wardCode: '' });
        setDistricts([]); setWards([]); setShippingFee(0);
        
        try {
            const res = await axios.get(`https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${pId}`, {
                headers: { 'Token': GHN_TOKEN }
            });
            setDistricts(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleDistrictChange = async (e) => {
        const dId = e.target.value;
        setSelectedAddress(prev => ({ ...prev, districtId: dId, wardCode: '' }));
        setWards([]); setShippingFee(0);
        
        try {
            const res = await axios.get(`https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${dId}`, {
                headers: { 'Token': GHN_TOKEN }
            });
            setWards(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleWardChange = async (e) => {
        const wCode = e.target.value;
        if (!wCode) return;
        
        setSelectedAddress(prev => ({ ...prev, wardCode: wCode }));
        setLoadingFee(true);
        
        try {
            const currentSubtotal = checkoutItems.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
            
            // Dùng selectedAddress.districtId hiện có trong state
            const fee = await checkoutService.previewShippingFee(
                selectedAddress.districtId,
                wCode,
                currentSubtotal
            );
            console.log("Phí ship nhận được:", fee);
            setShippingFee(typeof fee === 'number' ? fee : 0);
            // setShippingFee(fee);
        } catch (err) {
            console.error("Lỗi tính phí ship:", err);
            setShippingFee(0);
        } finally {
            setLoadingFee(false);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        if (!selectedAddress.wardCode) {
            Swal.fire('Warning', 'Please select a complete shipping area!', 'warning');
            return;
        }

        const orderRequest = {
            shipName: formData.fullName.trim(),
            shipPhone: formData.phone,
            shipAddress: `${formData.address}, ${wards.find(w => w.WardCode === selectedAddress.wardCode)?.WardName}`,
            districtId: parseInt(selectedAddress.districtId),
            wardCode: selectedAddress.wardCode,
            paymentMethod: 'COD',
            selectedCartItemIds: checkoutItems.map(item => item.id)
        };

        try {
            // SỬ DỤNG SERVICE ĐỂ GỌI API ĐẶT HÀNG
            // await checkoutService.placeOrder(orderRequest);
            
            // localStorage.removeItem('checkoutItems');

            let response;

        // 2. KIỂM TRA NGUỒN GỐC ĐƠN HÀNG
        // Logic Buy Now chỉ chạy nếu location.state có cờ isBuyNow từ ProductDetail truyền sang
                if (location.state?.isBuyNow && location.state?.items?.length > 0) {
                    const item = location.state.items[0]; 
                    
                    // Gọi API buyNow: Truyền productId, quantity vào Params và orderRequest vào Body
                    response = await checkoutService.buyNow(item.productId, item.quantity, orderRequest);
                } else {
                    // Trường hợp mặc định: Đặt hàng từ danh sách sản phẩm trong giỏ hàng
                    response = await checkoutService.placeOrder(orderRequest);
                }
                
                // 3. Xử lý sau thành công
                if (!location.state?.isBuyNow) {
                    localStorage.removeItem('checkoutItems'); // Chỉ xóa cache giỏ hàng nếu không phải Buy Now
                }

            await Swal.fire({
                icon: 'success',
                title: 'Order Placed!',
                text: 'Your order has been recorded successfully.',
                timer: 2000
            });
        } catch (err) {
            console.error("Oops, something went wrong!", err);
            Swal.fire('Error', err.response?.data || 'Failed to place order. Please try again.', 'error');
        }
    };

    // const subtotal = checkoutItems.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
    const subtotal = checkoutItems.reduce((sum, item) => {
        // Lấy giá: Ưu tiên item.product.salePrice (Giỏ hàng), 
        // nếu không có thì lấy item.price (Buy Now)
        const price = item.product?.salePrice ?? item.price ?? 0;
        return sum + (price * item.quantity);
    }, 0);
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
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 ml-1">FULL NAME</label>
                                    <input 
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                        disabled={useProfileInfo}
                                        placeholder="Enter full name" 
                                        className="border border-slate-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50 transition-all outline-none" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 ml-1">PHONE NUMBER</label>
                                    <input 
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        disabled={useProfileInfo}
                                        placeholder="Enter phone number" 
                                        className="border border-slate-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50 outline-none" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 ml-1">STREET ADDRESS</label>
                                    <input 
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        disabled={useProfileInfo}
                                        placeholder="House number, Street name..." 
                                        className="border border-slate-200 p-4 rounded-xl w-full focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50 outline-none" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Area */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                                Shipping Area
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select onChange={handleProvinceChange} value={selectedAddress.provinceId} className="...">
                                    <option value="">Select Province</option>
                                    {/* Thêm kiểm tra provinces tồn tại và là mảng */}
                                    {Array.isArray(provinces) && provinces.map(p => (
                                        <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                                    ))}
                                </select>
                                <select onChange={handleDistrictChange} value={selectedAddress.districtId} disabled={!selectedAddress.provinceId} className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" required>
                                    <option value="">Select District</option>
                                    {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                                </select>
                                <select onChange={handleWardChange} value={selectedAddress.wardCode} disabled={!selectedAddress.districtId} className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" required>
                                    <option value="">Select Ward</option>
                                    {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
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
                                        <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 p-1 group-hover:scale-105 transition-transform">
                                            <img src={item.product?.image} alt={item.product?.variantName} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate text-slate-100 uppercase tracking-tight">{item.product?.variantName}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Quantity: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-100">${(item.product?.salePrice * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Section */}
                            <div className="mt-6 mb-6 pt-6 border-t border-slate-800">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Have a promo code?</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value);
                                            setCouponError('');
                                        }}
                                        placeholder="Enter code"
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all text-white"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="bg-orange-600 hover:bg-orange-700 px-5 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                                    >
                                        APPLY
                                    </button>
                                </div>
                                {couponError && <p className="text-red-400 text-[10px] mt-2 ml-1">{couponError}</p>}
                            </div>

                            {/* Totals */}
                            <div className="space-y-4 text-sm pt-4">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Shipping</span>
                                    <span className="text-blue-400 font-bold">
                                        {loadingFee ? (
                                            <span className="animate-pulse">Calculating...</span>
                                        ) : (
                                           shippingFee === 0 ? 'FREE' : `$${Number(shippingFee).toFixed(2)}`
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
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors group">
                                      <PiShippingContainerFill className="text-orange-400 text-lg group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-bold text-slate-300 tracking-tighter">COD</span>
                                  </div>

                                  {/* Badge PAYPAL */}
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-colors group">
                                      <RiPaypalFill className="text-[#003087] text-lg group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-bold text-slate-300 tracking-tighter">PAYPAL</span>
                                  </div>
                              </div>
                          </div>
                            
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