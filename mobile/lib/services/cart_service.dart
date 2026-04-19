import 'dart:convert'; // Để dùng jsonEncode và jsonDecode
import 'package:dio/dio.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CartService {
  // Thay đổi URL theo địa chỉ máy của bạn (10.0.2.2 cho Android Emulator)
  final String baseUrl = "http://10.0.2.2:8080/api/public/cart-items";
  final Dio _dio = Dio();

  // 1. 🛒 THÊM VÀO GIỎ HÀNG (Dùng cho cả Product Detail và Checkout Buy Now)
  // Backend: CartItemController -> addToCart
  Future<bool> addToCart(int productId, int quantity, String token) async {
    try {
      final response = await _dio.post(
        "$baseUrl/add",
        queryParameters: {
          'productId': productId,
          'quantity': quantity,
        },
        options: Options(
          headers: {"Authorization": "Bearer $token"},
        ),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print("Lỗi Add To Cart: $e");
      return false;
    }
  }

  // 2. 🔄 MERGE GIỎ HÀNG GUEST VÀO USER (Gọi sau khi Login thành công)
  // Backend: CartItemController -> mergeCart
  Future<bool> mergeGuestCart(String token, List<Map<String, dynamic>> guestItems) async {
    if (guestItems.isEmpty) return true;
    try {
      final response = await _dio.post(
        "$baseUrl/merge",
        data: jsonEncode(guestItems), // Biến List Map thành JSON String
        options: Options(
          headers: {
            "Authorization": "Bearer $token",
            "Content-Type": "application/json",
          },
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Lỗi Merge Cart: $e");
      return false;
    }
  }

  // 3. 📄 LẤY TOÀN BỘ GIỎ HÀNG
  // Backend: getFullCartDetails
  Future<List<CartItemModel>> getMyCart(String token) async {
    try {
      final response = await _dio.get(
        baseUrl,
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      if (response.statusCode == 200) {
        List list = response.data;
        return list.map((item) => CartItemModel.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print("Lỗi lấy giỏ hàng: $e");
      return [];
    }
  }

  // 4. ➕➖ CẬP NHẬT SỐ LƯỢNG
  // Backend: updateQuantity
  Future<void> updateQuantity(int cartItemId, int quantity, String token) async {
    await _dio.put(
      "$baseUrl/$cartItemId",
      queryParameters: {'quantity': quantity},
      options: Options(headers: {"Authorization": "Bearer $token"}),
    );
  }

  // 5. ✅ BẬT/TẮT CHỌN SẢN PHẨM (Checkbox)
  // Backend: toggleSelection
  Future<void> toggleSelection(int cartItemId, String token) async {
    await _dio.patch(
     "$baseUrl/$cartItemId/toggle-selection",
      options: Options(headers: {"Authorization": "Bearer $token"}),
    );
  }

  Future<void> toggleAllSelection(String token, bool selected) async {
  try {
    await _dio.patch(
      "$baseUrl/toggle-all", // Khớp với @PutMapping("/toggle-all") ở Backend
      queryParameters: {'selected': selected},
      options: Options(headers: {"Authorization": "Bearer $token"}),
    );
  } catch (e) {
    print("Lỗi Toggle All: $e");
  }
}

  // 6. ❌ XÓA SẢN PHẨM KHỎI GIỎ
  // Backend: removeItem
  Future<void> removeItem(int cartItemId, String token) async {
    await _dio.delete(
      "$baseUrl/$cartItemId",
      options: Options(headers: {"Authorization": "Bearer $token"}),
    );
  }

  // ❌ XÓA NHIỀU SẢN PHẨM CÙNG LÚC
  // Backend: CartItemServiceImpl -> removeMultipleItems
  Future<bool> removeMultipleItems(List<int> ids, String token) async {
    if (ids.isEmpty) return true;
    try {
      final response = await _dio.delete(
        "$baseUrl/remove-multiple", // Đảm bảo endpoint này khớp với @DeleteMapping bên Java
        data: ids, // Gửi trực tiếp list [1, 2, 3]
        options: Options(headers: {"Authorization": "Bearer $token"},
        contentType: "application/json",
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Lỗi xóa nhiều món: $e");
      return false;
    }
  }

  // 1. 💾 LƯU MÓN HÀNG VÀO MÁY (Public - Không cần Token)
  Future<bool> addToGuestCart(dynamic product, int quantity) async {
  try {
    const storage = FlutterSecureStorage();
    // 1. Đọc danh sách giỏ hàng hiện tại từ máy
    String? cartData = await storage.read(key: 'guest_cart');
    List<dynamic> cartList = cartData != null ? jsonDecode(cartData) : [];

    // 2. Kiểm tra xem sản phẩm đã có trong giỏ chưa
    int index = cartList.indexWhere((item) => item['id'] == product.id);

    if (index != null && index >= 0) {
      // Nếu có rồi thì tăng số lượng
      cartList[index]['quantity'] += quantity;
    } else {
      // Nếu chưa có thì thêm mới vào list
      cartList.add({
        'id': product.id,
        'variantName': product.variantName,
        'price': product.salePrice,
        'imageUrl': product.imageUrl,
        'quantity': quantity,
        'isSelected': true, // Mặc định chọn luôn
      });
    }

    // 3. Lưu lại danh sách mới vào máy
    await storage.write(key: 'guest_cart', value: jsonEncode(cartList));
    return true;
  } catch (e) {
    print("Lỗi lưu giỏ hàng máy: $e");
    return false;
  }
}

  // 2. 📖 LẤY GIỎ HÀNG TỪ MÁY (Public)
  Future<List<CartItemModel>> getGuestCart() async {
    final prefs = await SharedPreferences.getInstance();
    String? json = prefs.getString('guest_cart');
    
    if (json == null || json.isEmpty) return [];
    
    List list = jsonDecode(json);
    return list.map((item) => CartItemModel.fromJson(item)).toList();
  }

  // 3. 🗑️ XÓA GIỎ HÀNG GUEST (Sau khi đã Merge thành công)
  Future<void> clearGuestCart() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('guest_cart');
  }

  Future<void> saveAllGuestItems(List<CartItemModel> items) async {
    final prefs = await SharedPreferences.getInstance();
    // Chuyển danh sách Model thành chuỗi JSON để lưu
    String encodedData = jsonEncode(items.map((i) => i.toJson()).toList()); 
    await prefs.setString('guest_cart', encodedData);
  }

  Future<int> getCartCountFromApi(String token) async {
    try {
      final response = await _dio.get(
        "$baseUrl/count", // Endpoint khớp với @GetMapping("/count") bên Java
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      if (response.statusCode == 200) {
        return response.data as int; // Backend của bé trả về số lượng là kiểu Integer
      }
      return 0;
    } catch (e) {
      print("Lỗi lấy số lượng giỏ hàng: $e");
      return 0;
    }
  }
}