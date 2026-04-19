import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/screens/checkout_page.dart';
import 'package:electromart_flutter/screens/login_screen.dart';
import 'package:electromart_flutter/screens/main_page.dart';
import 'package:electromart_flutter/services/cart_service.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
// import 'models.dart'; // 👉 Nhớ import file Model của bạn
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ProductDetailPage extends StatefulWidget {
  final String slug; // Nhận slug từ HomePage truyền sang

  const ProductDetailPage({super.key, required this.slug});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  final Color primaryColor = const Color(0xFF045fae);
  final Color accentColor = const Color(0xFFf97316);
  final Color bgColor = const Color(0xFFf5f7f8);

  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:8080/api/public'));

  ProductDetailModel? _product;
  bool _isLoading = true;
  String? _errorMessage;
  int _currentImageIndex = 0; // Để làm chấm bi báo hiệu ảnh hiện tại
  String? _token;
  int _cartCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchProductDetail();
    _loadToken();
  }

  Future<void> _fetchProductDetail() async {
    try {
      final response = await _dio.get('/products/${widget.slug}');
      setState(() {
        _product = ProductDetailModel.fromJson(response.data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = "Không thể tải thông tin sản phẩm.";
        _isLoading = false;
      });
    }
  }

  Future<void> _loadToken() async {
  const storage = FlutterSecureStorage();
  String? savedToken = await storage.read(key: 'jwt_token');
  setState(() {
    _token = savedToken;
  });
}

Future<void> _loadCartCount() async {
  try {
    const storage = FlutterSecureStorage();
    String? token = await storage.read(key: 'jwt_token');
    
    int count = 0;
    if (token != null) {
      // Nếu đã login, gọi API lấy số lượng từ server
      final cartData = await CartService().getMyCart(token);
      count = cartData.length;
    } else {
      // Nếu là khách, đọc từ local storage
      final guestData = await CartService().getGuestCart();
      count = guestData.length;
    }

    setState(() {
      _cartCount = count; 
    });
  } catch (e) {
    print("Lỗi load số lượng: $e");
  }
}

  void _showQuantitySheet({required bool isBuyNow}) {
  int localQuantity = 1; // Biến tạm để lưu số lượng trong sheet

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) {
      return StatefulBuilder( // Dùng StatefulBuilder để update số lượng ngay trong BottomSheet
        builder: (context, setSheetState) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Hiển thị Ảnh và Tên sản phẩm
                Row(
                  children: [
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(_product!.images[0], fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _product!.variantName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 5),
                          Text(
                            "\$${(_product!.salePrice ?? _product!.basePrice).toStringAsFixed(2)}",
                            style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 30),

                // 2. Ô thay đổi số lượng (Quantity Picker)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Select Quantity", style: TextStyle(fontWeight: FontWeight.w500)),
                    Row(
                      children: [
                        _buildQtyBtn(Icons.remove, () {
                          if (localQuantity > 1) setSheetState(() => localQuantity--);
                        }),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 15),
                          child: Text("$localQuantity", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                        _buildQtyBtn(Icons.add, () {
                          // Backend của bé có stockQuantity nên bé có thể check ở đây
                          setSheetState(() => localQuantity++);
                        }),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 30),

                // 3. Nút xác nhận hành động
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context); // Đóng sheet
                      if (isBuyNow) {
                        _onConfirmBuyNow(localQuantity); // Gọi logic mua ngay với số lượng thực
                      } else {
                        _onConfirmAddToCart(localQuantity); // Gọi logic thêm vào giỏ với số lượng thực
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isBuyNow ? accentColor : primaryColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      isBuyNow ? "PROCEED TO CHECKOUT" : "CONFIRM ADD TO CART",
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          );
        },
      );
    },
  );
}

void _showLoginRequiredDialog() {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text("Login Required"),
      content: const Text("You need to login to use the 'Buy Now' feature. Do you want to login now?"),
      actions: [
        // Nút Hủy
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("CANCEL", style: TextStyle(color: Colors.grey)),
        ),
        // Nút Đăng nhập
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context); // Đóng Dialog
            // Chuyển hướng sang trang Login của bé
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
          },
          style: ElevatedButton.styleFrom(backgroundColor: accentColor),
          child: const Text("LOGIN NOW"),
        ),
      ],
    ),
  );
}

void _onConfirmAddToCart(int quantity) async {
  const storage = FlutterSecureStorage();
  String? token = await storage.read(key: 'jwt_token'); // Đọc token mới nhất

  bool success = false;

  if (token != null) {
    // TRƯỜNG HỢP 1: Đã login -> Lưu lên Server
    success = await CartService().addToCart(_product!.id, quantity, token);
  } else {
    // TRƯỜNG HỢP 2: Chưa login (Guest) -> Lưu vào máy
    success = await CartService().addToGuestCart(_product!, quantity); 
  }

  if (success) {
    // 1. Hiện thông báo cho khách vui
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Added $quantity item(s) to cart!"),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );

    Navigator.pushAndRemoveUntil(
    context,
    MaterialPageRoute(builder: (context) => const MainPage(initialIndex: 4)), // Giả sử Profile là index 4
    (route) => false,
  );
  }
}

void _onConfirmBuyNow(int quantity) async {
  if (_token == null) {
    _showLoginRequiredDialog();
    return;
  }

  setState(() => _isLoading = true); // Hiện loading cho chuyên nghiệp

  // 1. Thêm vào giỏ trên Server (để giữ món hàng trong DB)
  bool success = await CartService().addToCart(_product!.id, quantity, _token!);

  if (success) {
    
    // 2. Tạo một Model ảo chỉ chứa duy nhất sản phẩm này để mang sang Checkout
    final buyNowItem = CartItemModel(
      id: 0, 
      productId: _product!.id, 
      variantName: _product!.variantName,
      imageUrl: (_product!.images != null && _product!.images!.isNotEmpty) 
          ? _product!.images!.first 
          : '',
      price: _product!.salePrice ?? _product!.basePrice,
      quantity: quantity, 
      isSelected: true,
    );

    // 3. Tính toán nhanh các con số
    double subtotal = buyNowItem.price * quantity;
    double shipping = subtotal >= 1500 ? 0.0 : 15.0; // Mốc freeship của bé
    double tax = subtotal * 0.1;
    double total = subtotal + shipping + tax;

    // 4. "Bay" thẳng sang Checkout, bỏ qua bước vào trang Cart
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CheckoutPage(
            selectedItems: [buyNowItem], // Truyền list chỉ 1 món
            subtotal: subtotal,
            shippingFee: shipping,
            totalAmount: total,
          ),
        ),
      );
    }
  }
  setState(() => _isLoading = false);
}

// Widget phụ trợ làm nút + - cho đẹp
Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
  return GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 18),
    ),
  );
}

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_errorMessage != null || _product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Lỗi")),
        body: Center(child: Text(_errorMessage ?? "Sản phẩm không tồn tại")),
      );
    }

    // Tính toán giá và % giảm giá
    double finalPrice = _product!.salePrice ?? _product!.basePrice;
    int discountPercent = 0;
    if (_product!.salePrice != null &&
        _product!.salePrice! < _product!.basePrice) {
      discountPercent =
          ((1 - (_product!.salePrice! / _product!.basePrice)) * 100).round();
    }

    return Scaffold(
      backgroundColor: bgColor,
      // 👉 APP BAR THEO DESIGN CỦA BẠN
      appBar: AppBar(
        backgroundColor: bgColor.withOpacity(0.9),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: const Text(
          "ElectroMart",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: Colors.black87),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageGallery(),
            _buildProductInfo(finalPrice, discountPercent),
          ],
        ),
      ),
      // 👉 GỘP CHUNG NÚT MUA VÀ BOTTOM NAV VÀO 1 COLUMN DƯỚI ĐÁY
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildStickyBuyBar(),
          // Bỏ comment dòng dưới nếu bạn bắt buộc muốn hiện thanh Nav Bar ở trang Detail
          // _buildBottomNavbar(),
        ],
      ),
    );
  }

  // 1. IMAGE GALLERY KÈM SWIPE INDICATOR
  Widget _buildImageGallery() {
    return Container(
      height: 400,
      color: Colors.white,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          PageView.builder(
            itemCount: _product!.images.length,
            onPageChanged: (index) {
              setState(() => _currentImageIndex = index);
            },
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.all(32.0),
                child: Image.network(
                  _product!.images[index],
                  fit: BoxFit.contain,
                ),
              );
            },
          ),
          // Các chấm bi hiển thị ảnh đang xem
          Positioned(
            bottom: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_product!.images.length, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 6,
                  width: _currentImageIndex == index ? 24 : 6,
                  decoration: BoxDecoration(
                    color: _currentImageIndex == index
                        ? primaryColor
                        : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  // 2. NỘI DUNG THÔNG TIN SẢN PHẨM
  Widget _buildProductInfo(double finalPrice, int discountPercent) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tag & Rating
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  "NEW ARRIVAL",
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(Icons.star, color: accentColor, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    _product!.averageRating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    "(${_product!.viewCount} views)",
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Tên sản phẩm & Summary
          Text(
            _product!.variantName,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _product!.summary,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 20),

          // Khu vực Giá
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                "\$${finalPrice.toStringAsFixed(2)}",
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 12),
              if (discountPercent > 0) ...[
                Text(
                  "\$${_product!.basePrice.toStringAsFixed(2)}",
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 16,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  "$discountPercent% OFF",
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 24),

          // Key Features (Lấy động từ Backend)
          if (_product!.attributes.isNotEmpty) ...[
            const Text(
              "Key Features",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              // Lấy tối đa 4 thuộc tính để hiển thị
              itemCount: _product!.attributes.length > 4
                  ? 4
                  : _product!.attributes.length,
              itemBuilder: (context, index) {
                String key = _product!.attributes.keys.elementAt(index);
                String value = _product!.attributes.values.elementAt(index);

                // Mẹo nhỏ: Đổi icon linh hoạt theo tên thuộc tính
                IconData icon = Icons.memory;
                if (key.toLowerCase().contains("camera"))
                  icon = Icons.photo_camera;
                if (key.toLowerCase().contains("pin") ||
                    key.toLowerCase().contains("battery"))
                  icon = Icons.battery_charging_full;

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(icon, color: primaryColor, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              key,
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 10,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              value,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
          ],

          // Description
          const Text(
            "Description",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            _product!.description,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  // 3. STICKY BUY BUTTONS
  Widget _buildStickyBuyBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Container(
              height: 54,
              width: 54,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300, width: 2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: IconButton(
                icon: const Icon(Icons.favorite_border, color: Colors.grey),
                onPressed: () {},
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _showQuantitySheet(isBuyNow: false),
                icon: const Icon(Icons.shopping_cart_outlined, size: 20),
                label: const Text("Add to Cart"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 5,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _showQuantitySheet(isBuyNow: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 5,
                ),
                child: const Text(
                  "Buy Now",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
