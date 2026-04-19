import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class OrderServiceUser {
  // Cấu hình Dio
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://10.0.2.2:8080/api/users', // Base URL cho User APIs
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  // Hàm helper để lấy Token và cấu hình Header tự động
  Future<Options> _getAuthOptions() async {
    String? token = await _storage.read(key: 'jwt_token');
    return Options(headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    });
  }

  /// 1. Lấy danh sách lịch sử đơn hàng của tôi (Có phân trang)
  /// Tương ứng với OrderController -> @GetMapping("/me")
  Future<Map<String, dynamic>> getMyOrders({int page = 0, int size = 10}) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.get(
        '/orders/me',
        queryParameters: {'page': page, 'size': size},
        options: options,
      );
      return response.data; // Trả về Map chứa 'content', 'totalPages', v.v.
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// 2. Lấy chi tiết một đơn hàng (Các sản phẩm bên trong đơn)
  /// Tương ứng với OrderItemController -> @GetMapping("/{orderId}")
  Future<List<dynamic>> getOrderItems(int orderId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.get(
        '/order-details/$orderId', 
        options: options
      );
      return response.data as List<dynamic>; // Trả về danh sách các OrderItem
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// 3. Xem chi tiết thông tin vận chuyển/tổng thanh toán của 1 đơn hàng
  /// Tương ứng với OrderController -> @GetMapping("/{id}")
  Future<Map<String, dynamic>> getOrderDetailSummary(int orderId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.get('/orders/$orderId', options: options);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// 4. Yêu cầu hủy đơn hàng
  /// Tương ứng với OrderController -> @PostMapping("/{id}/cancel")
  Future<String> cancelOrder(int orderId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.post('/orders/$orderId/cancel', options: options);
      return response.data['message'] ?? 'Hủy đơn hàng thành công';
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Hàm xử lý lỗi tập trung
  String _handleError(DioException e) {
    if (e.response != null) {
      // Lỗi trả về từ Server (400, 401, 403, 500)
      return e.response?.data['message'] ?? 'Lỗi hệ thống (${e.response?.statusCode})';
    }
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
  }
}