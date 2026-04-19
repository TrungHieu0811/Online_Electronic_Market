import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart'; // Sử dụng BaseUrl từ ApiService bé đã có

class OrderService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiService.getBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  // 1. 🛒 THANH TOÁN GIỎ HÀNG (Checkout)
  // Backend: OrderController -> checkout
  Future<Map<String, dynamic>?> checkout(Map<String, dynamic> orderData) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      final response = await _dio.post(
        '/users/orders/checkout',
        data: orderData, // Gửi OrderRequest DTO
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      if (response.statusCode == 200) {
        return response.data; // Trả về {id: orderId}
      }
    } on DioException catch (e) {
      print("Lỗi Checkout: ${e.response?.data}");
      throw Exception(e.response?.data ?? "Cannot process checkout");
    }
    return null;
  }

  // 2. ⚡ MUA NGAY (Buy Now - Không qua giỏ hàng)
  // Backend: OrderController -> buyNow
  Future<Map<String, dynamic>?> buyNow(int productId, int quantity, Map<String, dynamic> orderData) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      final response = await _dio.post(
        '/users/orders/buy-now',
        queryParameters: {
          'productId': productId,
          'quantity': quantity,
        },
        data: orderData,
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data ?? "Buy Now failed");
    }
  }

  // 3. 📜 LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI
  // Backend: OrderController -> getMyOrders
  Future<Map<String, dynamic>> getMyOrders({int page = 0, int size = 5}) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      final response = await _dio.get(
        '/users/orders/me',
        queryParameters: {'page': page, 'size': size},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      return response.data; // Trả về Page object từ Spring Data
    } catch (e) {
      throw Exception("Cannot fetch orders");
    }
  }

  // 4. 🔍 LẤY CHI TIẾT MỘT ĐƠN HÀNG
  // Backend: OrderController -> getOrderDetail
  Future<Map<String, dynamic>> getOrderDetail(int orderId) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      final response = await _dio.get(
        '/users/orders/$orderId',
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      return response.data;
    } catch (e) {
      throw Exception("Cannot fetch order details");
    }
  }

  // 5. ❌ HỦY ĐƠN HÀNG
  // Backend: OrderController -> cancelOrder
  Future<bool> cancelOrder(int orderId) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      final response = await _dio.post(
        '/users/orders/$orderId/cancel',
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // 6. 🚚 XEM TRƯỚC PHÍ SHIP (Dành cho trang Checkout)
  // Backend: OrderController -> previewFee
  Future<double> previewShippingFee(int districtId, String wardCode, double totalAmount) async {
    try {
      final response = await _dio.get(
        '/users/orders/preview-fee',
        queryParameters: {
          'districtId': districtId,
          'wardCode': wardCode,
          'totalAmount': totalAmount,
        },
      );
      return (response.data as num).toDouble(); // Trả về phí ship USD
    } catch (e) {
      return 2.0; // Phí mặc định nếu lỗi
    }
  }

Future<List<dynamic>> getProvinces() async {
  final response = await ApiService().get('/users/orders/provinces'); 

  // Backend trả về chuỗi, mình giải mã ra
  var data = response is String ? jsonDecode(response) : response;
  
  // Trả về đúng danh sách 'data' của GHN
  return data['data']; 
}
}