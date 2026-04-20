import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/coupon_model.dart';

class CouponService {
  static const String baseUrl = "http://10.0.2.2:8080/api/users/coupons"; // URL theo Controller

  // 1. Kiểm tra nhanh mã có dùng được không (dùng khi khách bấm APPLY)
  Future<bool> validateCoupon(String code, double orderValue) async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/validate?code=$code&orderValue=$orderValue"),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as bool; // Trả về true/false từ Backend
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // 2. Lấy danh sách Coupon khả dụng cho đơn hàng hiện tại
  Future<List<CouponModel>> getAvailableCoupons(double orderValue, String token) async {
  try {
    final response = await http.get(
      Uri.parse("$baseUrl/available?orderValue=$orderValue"),
      headers: {
        'Authorization': 'Bearer $token', //
      },
    );

    if (response.statusCode == 200) {
      // 1. Giải mã body thành dynamic list
      final List<dynamic> data = jsonDecode(response.body);
      
      final List<CouponModel> list = data.map((json) => CouponModel.fromJson(json)).toList();
      
      return list;
    }
    return [];
  } catch (e) {
    print("Lỗi lấy danh sách coupon: $e");
    return [];
  }
}

  // 3. Lấy thông tin chi tiết của 1 Coupon theo mã code
  // (Dùng để lấy số tiền giảm cụ thể sau khi khách nhập code thành công)
 Future<CouponModel?> getCouponDetail(String code, double orderValue, String token) async {
  try {
    // Gọi API lấy danh sách coupon dùng được cho đơn hàng này
    final response = await http.get(
      Uri.parse("$baseUrl/available?orderValue=$orderValue"),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      // Chuyển JSON thành List CouponModel
      final list = data.map((json) => CouponModel.fromJson(json)).toList();
      
      // Tìm mã khách đã nhập trong danh sách trả về (không phân biệt hoa thường)
      try {
        return list.firstWhere((c) => c.code.toUpperCase() == code.toUpperCase());
      } catch (e) {
        return null; // Không tìm thấy mã trong danh sách khả dụng
      }
    }
    return null;
  } catch (e) {
    print("Lỗi lấy chi tiết Coupon: $e");
    return null;
  }
}
}