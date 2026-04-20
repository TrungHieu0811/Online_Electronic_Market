import 'dart:convert';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:electromart_flutter/models/coupon_model.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/screens/profile_screen.dart';
import 'package:electromart_flutter/services/api_service.dart';
import 'package:electromart_flutter/services/coupon_service.dart';
import 'package:electromart_flutter/services/order_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart'; // Dùng cho AppLinks
import 'package:electromart_flutter/screens/order_history_screen.dart';

class CheckoutPage extends StatefulWidget {
  final List<CartItemModel> selectedItems;
  final double subtotal;
  final double shippingFee;
  final double totalAmount;

  const CheckoutPage({
    super.key,
    required this.selectedItems,
    required this.subtotal,
    required this.shippingFee,
    required this.totalAmount,
  });

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();

  final _storage = const FlutterSecureStorage();

  String _selectedPayment = "COD";
  bool _isLoadingProfile = true;

  bool _isLoading = false;
  bool _waitingForPayment = false;

  List<dynamic> _provinces = [];
  List<dynamic> _districts = [];
  List<dynamic> _wards = [];

  int? _selectedProvinceId;
  int? _selectedDistrictId;
  String? _selectedWardCode;
  double _discountAmount = 0.0;

  String? _token;

  double _currentShippingFee = 0.0;
  double _currentDistance = 0.0;

  final _appLinks = AppLinks();
  StreamSubscription? _linkSubscription;
  Future<void> _fetchProvinces() async {
    try {
      String? token = await _storage.read(key: 'jwt_token');

      setState(() {
        _token = token;
      });

      final res = await ApiService().get(
        "/users/orders/provinces",
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      // Giải mã nếu Backend trả về String, sau đó lọc như bản Web của bé
      var data = res is String ? jsonDecode(res) : res;
      if (data != null && data['data'] != null) {
        List<dynamic> list = data['data'];
        setState(() {
          _provinces = list
              .where(
                (p) =>
                    !p['ProvinceName'].contains('Test') &&
                    !p['ProvinceName'].contains('Hà Nội 02'),
              )
              .toList(); // 👈 Lọc sạch dữ liệu như Web của bé
        });
      }
    } catch (e) {
      print('Lỗi lấy tỉnh: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _loadDataFromProfile(); // Gọi hàm này khi mở trang
    _fetchProvinces();
    // 2. Lắng nghe Link trả về từ trình duyệt
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) _handlePaymentResult(uri);
    });

    // Lắng nghe link khi App đang chạy ngầm
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      if (_waitingForPayment) {
        _handlePaymentResult(uri);
      }
    });
  }

  void _handlePaymentResult(Uri uri) {
    // QUAN TRỌNG: Chỉ xử lý nếu chúng ta thực sự đang đợi thanh toán từ PayPal
    if (!_waitingForPayment) return;

    if (uri.scheme == 'electromart' && uri.host == 'checkout') {
      setState(() => _waitingForPayment = false);
      if (uri.path.contains('success')) {
        _showResultAndNavigate("Payment Successful!", Colors.green);
      } else {
        _showResultAndNavigate("Payment Failed or Canceled.", Colors.red);
      }
    }
  }

  void _showResultAndNavigate(String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));

    // Chuyển sang trang Order History
    Navigator.of(context, rootNavigator: true).pushReplacement(
      MaterialPageRoute(builder: (context) => const OrderHistoryScreen()),
    );
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  static const String GHN_TOKEN = "7929ef18-3653-11f1-a973-aee5264794df";

  // 1. Dùng hàm này khi chọn Tỉnh -> Lấy Huyện trực tiếp từ GHN
  void _onProvinceChanged(int? pId) async {
    if (pId == null) return;
    setState(() {
      _selectedProvinceId = pId;
      _selectedDistrictId = null;
      _districts = [];
      _currentShippingFee = 0;
    });

    try {
      // Gọi thẳng sang GHN như cách bé làm trên Web
      final res = await ApiService().get(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=$pId",
        options: Options(headers: {'Token': GHN_TOKEN}),
      );
      // GHN luôn trả về cục JSON có trường 'data'
      setState(() => _districts = res['data']);
    } catch (e) {
      print("Lỗi GHN District: $e");
    }
  }

  // 2. Dùng hàm này khi chọn Huyện -> Lấy Xã trực tiếp từ GHN
  void _onDistrictChanged(int? dId) async {
    if (dId == null) return;
    setState(() {
      _selectedDistrictId = dId;
      _selectedWardCode = null;
      _wards = [];
    });

    try {
      final res = await ApiService().get(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=$dId",
        options: Options(headers: {'Token': GHN_TOKEN}),
      );
      setState(() => _wards = res['data']);
    } catch (e) {
      print("Lỗi GHN Ward: $e");
    }
  }

  Future<void> _loadDataFromProfile() async {
    try {
      // 1. Gọi hàm getUserProfile có sẵn trong ApiService của bé
      final Map<String, dynamic> userData = await ApiService().getUserProfile();

      // 2. Đổ dữ liệu từ JSON vào các Controller
      setState(() {
        _fullNameController.text = userData['fullName'] ?? "";
        _emailController.text = userData['email'] ?? "";
        _phoneController.text = userData['phone'] ?? "";
        _addressController.text = userData['address'] ?? "";
        _isLoadingProfile = false;
      });
    } catch (e) {
      print("Lỗi khi load Profile: $e");
      setState(() => _isLoadingProfile = false);
      // Nếu lỗi (do hết hạn token), ApiService của bé đã tự xóa token rồi
    }
  }

  // Nút xác nhận đơn hàng

  void _onConfirmOrder() async {
    // 1. Kiểm tra dữ liệu đầu vào cơ bản
    if (_addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter your shipping address!")),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _waitingForPayment = true; // Bắt đầu đợi kết quả từ PayPal
    });

  // 2. Gom dữ liệu theo chuẩn OrderRequest DTO bên Java
  Map<String, dynamic> orderRequest = {
  "shipName": _fullNameController.text,
  "shipPhone": _phoneController.text,
  "shipAddress": _addressController.text,
  "note": "Order via Flutter Mobile App",
  "paymentMethod": _selectedPayment,
  "districtId": _selectedDistrictId, // 👈 Dùng biến đã chọn từ Dropdown
  "wardCode": _selectedWardCode,     // 👈 Dùng biến đã chọn từ Dropdown
  "couponCode": "", 
};

    try {
      final result = await OrderService().checkout(orderRequest);

      if (result != null && mounted) {
        int orderId = result['id'];

        if (_selectedPayment == "PAYPAL") {
          try {
            final payRes = await ApiService().get(
              "/users/payment/create?orderId=$orderId&method=PAYPAL&platform=mobile",
            );

            if (payRes != null && payRes['paymentUrl'] != null) {
              final Uri url = Uri.parse(payRes['paymentUrl']);
              // Chế độ externalApplication là bắt buộc để PayPal không chặn
              await launchUrl(url, mode: LaunchMode.externalApplication);
            }
          } catch (e) {
            print(
              "Lỗi lấy link PayPal: $e",
            ); // Log này sẽ hiện lỗi 403 nếu chưa sửa Security
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Order Placed Successfully!"),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const ProfileScreen()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        // Hiển thị lỗi từ Backend (Ví dụ: Sản phẩm hết hàng)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

Future<void> _updateShippingFee() async {
  if (_selectedDistrictId != null && _selectedWardCode != null) {
    try {
      // Gọi hàm previewShippingFee trong OrderService mình vừa tạo lúc nãy
      double fee = await OrderService().previewShippingFee(
        _selectedDistrictId!, 
        _selectedWardCode!, 
        widget.subtotal
      );
      
      setState(() {
        // Cập nhật lại phí ship để giao diện nhảy số tiền mới
        _currentShippingFee = fee; 
      });
    } catch (e) {
      print("Lỗi tính phí ship: $e");
    }
  }
}

  void _showCouponList() async {
    // 1. Lấy danh sách coupon khả dụng từ Server
    final List<CouponModel> availableCoupons = await CouponService()
        .getAvailableCoupons(widget.subtotal, _token!);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          height: 400,
          child: Column(
            children: [
              const Text(
                "Available Coupons",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: availableCoupons.isEmpty
                    ? const Center(
                        child: Text("No coupons available for this order"),
                      )
                    : ListView.builder(
                        itemCount: availableCoupons.length,
                        itemBuilder: (context, index) {
                          final coupon = availableCoupons[index];
                          return Card(
                            child: ListTile(
                              leading: const Icon(
                                Icons.local_offer,
                                color: Colors.orange,
                              ),
                              title: Text(coupon.code),
                              subtitle: Text(coupon.description),
                              trailing: Text(
                                "-${coupon.discountValue}${coupon.discountType == 'PERCENTAGE' ? '%' : '\$'}",
                              ),
                              onTap: () {
                                // 2. Khi khách chọn, điền mã vào ô nhập và đóng BottomSheet
                                _couponController.text = coupon.code;
                                Navigator.pop(context);
                                _applyCoupon(); // Tự động Apply luôn cho khách
                              },
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

void _applyCoupon() async {
  String code = _couponController.text.trim();
  // Gọi API validate để chắc chắn mã vẫn dùng được
  bool isValid = await CouponService().validateCoupon(code, widget.subtotal);

  if (isValid) {
    // Lấy chi tiết mã để tính tiền giảm
    final coupon = await CouponService().getCouponDetail(code, _token!);
    
    if (coupon != null) {
      setState(() {
        if (coupon.discountType == "PERCENTAGE") {
          double calculated = (widget.subtotal * coupon.discountValue) / 100;
          // Nếu có mức giảm tối đa (maxDiscountAmount), thì lấy mức đó
          _discountAmount = (coupon.maxDiscountAmount != null && calculated > coupon.maxDiscountAmount!) 
              ? coupon.maxDiscountAmount! : calculated;
        } else {
          _discountAmount = coupon.discountValue; // FIXED_AMOUNT
        }
      });
    }
  } else {
    // Thông báo lỗi nếu mã không hợp lệ
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Invalid Coupon")));
  }
}

  @override
  Widget build(BuildContext context) {
    if (_isLoadingProfile) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6), // Nền xám nhạt như bản Web
      appBar: AppBar(
        title: const Text(
          "Complete Your Order",
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle("Shipping Information"),
            _buildShippingForm(),
            const SizedBox(height: 24),
            _buildShippingArea(),
            const SizedBox(height: 24),
            _buildSectionTitle("Promo Code"),
            _buildPromoCodeSection(), // 👈 Đưa ra ngoài vùng sáng

            const SizedBox(height: 24),
            _buildSectionTitle("Payment Method"),
            _buildPaymentSection(), // 👈 Đưa ra ngoài vùng sáng
            const SizedBox(height: 24),
            _buildSectionTitle("Order Summary"),
            _buildOrderSummaryCard(),
          ],
        ),
      ),
      bottomNavigationBar: _buildConfirmButton(),
    );
  }

  // Tiêu đề các phần
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            color: Colors.orange,
          ), // Vạch cam trang trí
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  // Form nhập liệu
  Widget _buildShippingForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildTextField("FULL NAME", _fullNameController),
          _buildTextField("EMAIL ADDRESS", _emailController),
          _buildTextField("PHONE NUMBER", _phoneController),
          _buildTextField("STREET ADDRESS", _addressController),
        ],
      ),
    );
  }

  Widget _buildShippingArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // 1. CHỌN TỈNH/THÀNH
          DropdownButtonFormField<int>(
            value: _selectedProvinceId,
            hint: const Text("Select Province"),
            items: _provinces
                .map(
                  (p) => DropdownMenuItem<int>(
                    value: p['ProvinceID'],
                    child: Text(p['ProvinceName']),
                  ),
                )
                .toList(),
            onChanged: (val) => _onProvinceChanged(val),
          ),
          const SizedBox(height: 12),

          // 2. CHỌN QUẬN/HUYỆN
          DropdownButtonFormField<int>(
            value: _selectedDistrictId,
            hint: const Text("Select District"),
            items: _districts
                .map(
                  (d) => DropdownMenuItem<int>(
                    value: d['DistrictID'],
                    child: Text(d['DistrictName']),
                  ),
                )
                .toList(),
            onChanged: (val) => _onDistrictChanged(val),
          ),
          const SizedBox(height: 12),

          // 3. CHỌN PHƯỜNG/XÃ
          DropdownButtonFormField<String>(
            value: _selectedWardCode,
            hint: const Text("Select Ward"),
            items: _wards
                .map(
                  (w) => DropdownMenuItem<String>(
                    value: w['WardCode'],
                    child: Text(w['WardName']),
                  ),
                )
                .toList(),
            onChanged: (val) {
              setState(() => _selectedWardCode = val);
              // Sau khi chọn xong xã, có thể gọi API tính phí ship ngay
              _updateShippingFee();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCodeSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _couponController,
                  decoration: InputDecoration(hintText: "Enter code"),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _applyCoupon,
                child: const Text("APPLY"),
              ),
            ],
          ),
          // 3. Nhấn vào đây để hiện danh sách
          TextButton(
            onPressed: _showCouponList,
            child: const Text(
              "View available coupons",
              style: TextStyle(color: Colors.orange),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildPaymentOption(
            Icons.payments_outlined,
            "COD (Cash on Delivery)",
            isSelected: _selectedPayment == "COD",
          ),
          const SizedBox(height: 12),
          _buildPaymentOption(
            Icons.account_balance_wallet_outlined,
            "PayPal / Credit Card",
            isSelected: _selectedPayment == "PAYPAL",
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(
    IconData icon,
    String label, {
    required bool isSelected,
  }) {
    return GestureDetector(
      onTap: () => setState(
        () => _selectedPayment = label.contains("COD") ? "COD" : "PAYPAL",
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF045fae) : Colors.grey.shade300,
            width: 2,
          ),
          color: isSelected
              ? const Color(0xFF045fae).withOpacity(0.05)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF045fae) : Colors.grey,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(Icons.check_circle, color: Color(0xFF045fae)),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          TextField(
            controller: controller,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.blue),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Tóm tắt đơn hàng màu tối
  Widget _buildOrderSummaryCard() {
    double taxAmount = widget.subtotal * 0.1;
    double totalPayPrice = widget.subtotal + taxAmount + _currentShippingFee - _discountAmount;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // Màu xanh đen như Web
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          // Danh sách sản phẩm thu nhỏ
          ...widget.selectedItems.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(item.imageUrl ?? '', width: 50, height: 50, fit: BoxFit.cover),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.variantName, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1),
                      Text("Quantity: ${item.quantity}", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                    ],
                  ),
                ),
              )
              .toList(),
          const Divider(color: Colors.grey),
          _summaryRow("Subtotal", "\$${widget.subtotal.toStringAsFixed(2)}"),
         _summaryRow(
              "Shipping", 
              _currentShippingFee == 0 ? "FREE" : "\$${_currentShippingFee.toStringAsFixed(2)}", 
              color: Colors.blue
            ),
          _summaryRow("Tax (10%)", "\$${(widget.subtotal * 0.1).toStringAsFixed(2)}"),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "TOTAL AMOUNT",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                // 2. Hiển thị totalPayPrice thay vì widget.totalAmount
                "\$${totalPayPrice.toStringAsFixed(2)}",
                style: const TextStyle(
                  color: Colors.orange,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {Color color = Colors.white}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: ElevatedButton(
        // Nếu đang loading thì vô hiệu hóa nút bấm để tránh khách nhấn nhiều lần
        onPressed: _isLoading ? null : _onConfirmOrder,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFF97316),
          minimumSize: const Size(double.infinity, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const CircularProgressIndicator(
                color: Colors.white,
              ) // Hiện vòng xoay khi đang xử lý
            : const Text(
                "Confirm Order",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }
}
