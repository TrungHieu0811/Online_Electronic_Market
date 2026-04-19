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
          'Authorization': 'Bearer $token', // Cần token vì Backend check theo UserID
        },
      );

      if (response.statusCode == 200) {
        List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => CouponModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // 3. Lấy thông tin chi tiết của 1 Coupon theo mã code
  // (Dùng để lấy số tiền giảm cụ thể sau khi khách nhập code thành công)
  Future<CouponModel?> getCouponDetail(String code, String token) async {
    try {
      // tận dụng API lấy danh sách rồi filter, hoặc viết thêm API getByCode ở Backend
      // Ở đây mình ví dụ gọi trực tiếp đến API Backend bé đã có (tương ứng CouponService.getCouponByCode)
      final response = await http.get(
        Uri.parse("http://10.0.2.2:8080/api/coupons/$code"), // Giả định endpoint này
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return CouponModel.fromJson(jsonDecode(response.body));
      }
    } catch (e) {
      print("Lỗi lấy thông tin Coupon: $e");
    }
    return null;
  }
}