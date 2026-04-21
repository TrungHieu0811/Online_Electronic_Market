import 'package:electromart_flutter/screens/checkout_page.dart';
import 'package:electromart_flutter/screens/login_screen.dart';
import 'package:electromart_flutter/screens/product_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import '../services/cart_service.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => CartScreenState();
}

class CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();
  List<CartItemModel> items = [];
  bool _isLoading = true;
  String? _token;

  // Logic tính toán hóa đơn
  double get subtotal => items.where((i) => i.isSelected).fold(0, (sum, i) => sum + (i.price * i.quantity));
  double get shipping => subtotal >= 1500 ? 0.0 : 0.0 ; // Miễn phí ship trên $1500
  double get tax => subtotal * 0.1; 
  double get total => subtotal + shipping + tax;

  @override
  void initState() {
    super.initState();
    _initData();
    fetchCart();
  }

  Future<void> _initData() async {
    const storage = FlutterSecureStorage();
    _token = await storage.read(key: 'jwt_token');
    fetchCart();
  }

  Future<void> fetchCart() async {
  setState(() => _isLoading = true);
  
  // LUÔN đọc lại token mới nhất trước khi gọi API
  const storage = FlutterSecureStorage();
  String? freshToken = await storage.read(key: 'jwt_token'); 
  
  List<CartItemModel> data;
  if (freshToken != null) {
    data = await _cartService.getMyCart(freshToken); // Lấy hàng của User
  } else {
    data = await _cartService.getGuestCart(); // Lấy hàng của Guest
  }
  
  setState(() {
    items = data;
    _isLoading = false;
  });
}

  // --- LOGIC XỬ LÝ ---
  Future<void> _updateQty(CartItemModel item, int newQty) async {
    if (newQty < 1) return;
    if (_token != null) {
      await _cartService.updateQuantity(item.id, newQty, _token!);
    } else {
      // Logic cho Guest: Cập nhật trực tiếp vào List và save lại máy
      item.quantity = newQty;
      await _cartService.saveAllGuestItems(items); 
    }
    fetchCart();
  }

  Future<void> _toggleItem(CartItemModel item) async {
    if (_token != null) {
      await _cartService.toggleSelection(item.id, _token!);
    } else {
      item.isSelected = !item.isSelected;
      await _cartService.saveAllGuestItems(items);
    }
    fetchCart();
  }

  Future<void> _toggleAll(bool selected) async {
  if (_token != null) {
    await _cartService.toggleAllSelection(_token!, selected);
  } else {
    // Nếu là khách, cập nhật trực tiếp trong list và save máy
    for (var item in items) {
      item.isSelected = selected;
    }
    await _cartService.saveAllGuestItems(items);
  }
  fetchCart(); // Load lại data để UI cập nhật
}

Future<void> _showDeleteConfirmation(CartItemModel item) async {
  bool? confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text("Remove Item"),
      content: const Text("Do you want to remove this item from your cart?"),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text("CANCEL"),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text("REMOVE", style: TextStyle(color: Colors.red)),
        ),
      ],
    ),
  );

  if (confirm == true) {
    if (_token != null) {
      // Đã login: Gọi API xóa trên Server
      await _cartService.removeItem(item.id, _token!);
    } else {
      // Khách: Xóa khỏi list local và save máy
      setState(() {
        items.removeWhere((i) => i.id == item.id);
      });
      await _cartService.saveAllGuestItems(items);
    }
    fetchCart(); // Load lại giao diện
  }
}

Future<void> _deleteSelectedItems() async {
  // 1. Lấy danh sách ID của các món đang được tích chọn
  List<int> selectedIds = items
      .where((item) => item.isSelected)
      .map((item) => item.id)
      .toList();

  if (selectedIds.isEmpty) return;

  // 2. Hiện thông báo xác nhận cho khách
  bool? confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text("Confirm Delete"),
      content: Text("Are you sure you want to delete ${selectedIds.length} selected items?"),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("CANCEL")),
        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("DELETE", style: TextStyle(color: Colors.red))),
      ],
    ),
  );

  if (confirm == true) {
    setState(() => _isLoading = true);
    bool success;
    
    if (_token != null) {
      // Gọi API xóa trên Server
      success = await _cartService.removeMultipleItems(selectedIds, _token!);
    } else {
      // Xóa ở local cho khách Guest
      items.removeWhere((item) => item.isSelected);
      await _cartService.saveAllGuestItems(items);
      success = true;
    }

    if (success) {
      fetchCart(); // Load lại giỏ hàng
    } else {
      setState(() => _isLoading = false);
    }
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text("Shopping Cart", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white, elevation: 0,
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty 
              ? _buildEmptyCart()
              : Column(
                  children: [
                    _buildShippingProgress(),
                    _buildSelectAllBar(), // Thanh màu cam
                    Expanded(child: ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (context, index) => _buildCartItem(items[index]),
                    )),
                    _buildOrderSummary(), // Phần tính tiền
                  ],
                ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  // --- UI COMPONENTS ---
  Widget _buildShippingProgress() {
    double target = 1500.0;
    double remaining = target - subtotal;
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          Text(remaining > 0 ? "You're \$${remaining.toStringAsFixed(2)} away from free shipping!" : "You've got FREE shipping!"),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: (subtotal / target).clamp(0.0, 1.0),
            backgroundColor: Colors.grey.shade200,
            color: Colors.orange,
            minHeight: 8,
          ),
        ],
      ),
    );
  }

  Widget _buildSelectAllBar() {
  bool isAllSelected = items.isNotEmpty && items.every((item) => item.isSelected);
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
    ),
    child: Row(
      children: [
        Checkbox(
          value: isAllSelected,
          onChanged: (val) => _toggleAll(val ?? false), // Gọi logic chọn tất cả
        ),
        Text("Select All (${items.length} items)", style: const TextStyle(fontWeight: FontWeight.w500)),
        const Spacer(),
        if (items.any((i) => i.isSelected)) // Chỉ hiện nút xóa khi có món được chọn
          TextButton.icon(
            onPressed: _deleteSelectedItems, // Hàm xóa nhiều món bé đã viết
            icon: const Icon(Icons.delete_sweep_outlined, size: 20, color: Colors.red),
            label: const Text("", style: TextStyle(color: Colors.red)),
          ),
      ],
    ),
  );
}


Widget _buildCartItem(CartItemModel item) {
  String displayUrl = item.imageUrl ?? '';
  if (displayUrl.isNotEmpty && !displayUrl.startsWith('http')) {
    displayUrl = 'http://10.0.2.2:8080/uploads$displayUrl';
  }

  return Dismissible(
    key: Key(item.id.toString()),
    direction: DismissDirection.endToStart,
    background: Container(
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.only(right: 20),
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.delete, color: Colors.white),
    ),
    confirmDismiss: (direction) async {
      return await showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text("Confirm"),
          content: const Text("Do you want to delete this item?"),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("CANCEL")),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text("DELETE", style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      );
    },
    onDismissed: (direction) async {
      if (_token != null) {
        await _cartService.removeItem(item.id, _token!);
      } else {
        items.removeWhere((i) => i.id == item.id);
        await _cartService.saveAllGuestItems(items);
      }
      fetchCart();
    },
    child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Checkbox(value: item.isSelected, onChanged: (v) => _toggleItem(item)),
          
          // ✨ BẮT ĐẦU PHẦN SỬA: Bọc InkWell để chuyển trang chi tiết
          Expanded(
            child: InkWell(
              onTap: () {
                print("DEBUG SLUG: ${item.slug}");
                // Kiểm tra xem item có slug không để điều hướng
                if (item.slug != null && item.slug!.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductDetailPage(slug: item.slug!),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Product details not available")),
                  );
                }
              },
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      displayUrl,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(Icons.image_not_supported),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.variantName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          "\$${item.price.toStringAsFixed(2)}",
                          style: const TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // ✨ KẾT THÚC PHẦN SỬA

          _buildQtySelector(item),
        ],
      ),
    ),
  );
}



  // Widget _buildQtySelector(CartItemModel item) {
  //   return Container(
  //     decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
  //     child: Row(
  //       children: [
  //         IconButton(icon: const Icon(Icons.remove, size: 16), onPressed: () => _updateQty(item, item.quantity - 1)),
  //         Text("${item.quantity}"),
  //         IconButton(icon: const Icon(Icons.add, size: 16), onPressed: () => _updateQty(item, item.quantity + 1)),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildQtySelector(CartItemModel item) {
  // Dùng TextEditingController để quản lý việc nhập liệu từ bàn phím
  final TextEditingController qtyController = TextEditingController(text: item.quantity.toString());

  return Container(
    decoration: BoxDecoration(
      border: Border.all(color: Colors.grey.shade300),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      children: [
        // Nút Giảm (-)
        IconButton(
          icon: const Icon(Icons.remove, size: 16),
          onPressed: () {
            if (item.quantity > 1) {
              // Nếu > 1 thì trừ bình thường
              _updateQty(item, item.quantity - 1);
            } else {
              // Nếu đang là 1 mà nhấn trừ -> Hỏi xem có muốn xóa không
              _showDeleteConfirmation(item);
            }
          },
        ),
        
        // Ô nhập số lượng trực tiếp
        SizedBox(
          width: 40,
          child: TextField(
            controller: qtyController,
            keyboardType: TextInputType.number, // Hiện bàn phím số
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(
              isDense: true,
              contentPadding: EdgeInsets.symmetric(vertical: 8),
              border: InputBorder.none,
            ),
            onSubmitted: (value) {
              int? newQty = int.tryParse(value);
              if (newQty != null) {
                if (newQty <= 0) {
                  // Nếu nhập 0 hoặc số âm -> Hiện xác nhận xóa
                  _showDeleteConfirmation(item);
                } else {
                  // Logic kiểm tra stock như cũ của
                  int stockLimit = item.stockQuantity ?? 99;
                  if (newQty > stockLimit) newQty = stockLimit;
                  _updateQty(item, newQty);
                }
              }
            },
          ),
        ),

        // Nút Tăng (+)
        IconButton(
          icon: const Icon(Icons.add, size: 16),
          onPressed: () {
            int stockLimit = item.stockQuantity ?? 99;
            if (item.quantity < stockLimit) {
              _updateQty(item, item.quantity + 1);
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("Maximum stock reached!")),
              );
            }
          },
        ),
      ],
    ),
  );
}

  Widget _buildOrderSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      child: Column(
        children: [
          _summaryRow("Subtotal", "\$${subtotal.toStringAsFixed(2)}"),
          // _summaryRow("Shipping", shipping == 0 ? "FREE" : "\$${shipping.toStringAsFixed(2)}", color: shipping == 0 ? Colors.green : Colors.black),
          _summaryRow("Tax (10%)", "\$${tax.toStringAsFixed(2)}"),
          const Divider(),
          _summaryRow("Estimated Total", "\$${total.toStringAsFixed(2)}", isBold: true),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isBold = false, Color color = Colors.black}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: color)),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
  return Container(
    padding: const EdgeInsets.all(16),
    color: Colors.white,
    child: ElevatedButton(
      onPressed: () async {
        // 1. Kiểm tra Token để biết đã đăng nhập hay chưa
        const storage = FlutterSecureStorage();
        String? token = await storage.read(key: 'jwt_token');

        if (token == null) {
          // TRƯỜNG HỢP CHƯA LOGIN: Hiện thông báo nhắc nhở
          if (!mounted) return;
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text("Login Required"),
              content: const Text(
                "You need to login to proceed to checkout. Your guest cart will be saved and merged after login.",
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("CANCEL", style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Đóng dialog
                    // Chuyển hướng sang trang Login
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF045FAE), foregroundColor: Colors.white,),
                  child: const Text("LOGIN NOW"),
                ),
              ],
            ),
          );
          return; // Dừng lại, không cho chuyển sang trang Checkout
        }

        // 2. TRƯỜNG HỢP ĐÃ LOGIN: Tiếp tục logic kiểm tra giỏ hàng của bé
        List<CartItemModel> selectedItems = items.where((item) => item.isSelected).toList();

        if (selectedItems.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Please select at least one item!")),
          );
          return;
        }

        // 3. Chuyển sang trang Checkout như bình thường
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CheckoutPage(
              selectedItems: selectedItems,
              subtotal: subtotal,
              shippingFee: shipping,
              totalAmount: total,
            ),
          ),
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF045FAE),
        minimumSize: const Size(double.infinity, 54),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: const Text(
        "Proceed to Checkout",
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
    ),
  );
}

  Widget _buildEmptyCart() => const Center(child: Text("Your cart is empty!"));
}