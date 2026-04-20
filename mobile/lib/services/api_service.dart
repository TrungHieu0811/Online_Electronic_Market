import 'dart:convert';
import 'dart:io' show Platform;
import 'package:electromart_flutter/models/comment_model.dart';
import 'package:electromart_flutter/models/order_review_page.dart';
import 'package:electromart_flutter/models/review_model.dart';
import 'package:electromart_flutter/models/review_summary_model.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';
import '../models/register_request.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/login_request.dart';

class ApiService {
  // Viết một hàm tự động lấy Base URL tùy theo môi trường
  static String get getBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api'; // Tự động dùng localhost nếu bạn chạy trên Web
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:8080/api'; // Tự động dùng 10.0.2.2 nếu bạn chạy trên Emulator
    } else {
      // Trường hợp dự phòng (Fallback) cho iOS Simulator, Windows, macOS...
      return 'http://localhost:8080/api';
    }
  }

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: getBaseUrl, // Sử dụng hàm trên ở đây
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  // KHỞI TẠO KÉT SẮT BẢO MẬT
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // --- HÀM LOGIN VÀ LƯU TOKEN ---
  Future<bool> loginUser(LoginRequest request) async {
    try {
      final response = await _dio.post('/auth/login', data: request.toJson());

      // IN RA CONSOLE ĐỂ XEM SPRING BOOT ĐANG TRẢ VỀ CÁI GÌ
      print("=== [DEBUG] KẾT QUẢ LOGIN: ${response.data}");

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        String? token;

        // Bắt mọi trường hợp tên biến mà Spring Boot có thể trả về
        if (data is Map) {
          token = data['token'] ?? data['accessToken'] ?? data['access_token'];
        } else if (data is String) {
          token = data; // Trường hợp trả về chuỗi Token thô không có JSON
        }

        if (token != null && token.isNotEmpty) {
          // Lưu Token vào két sắt
          await _storage.write(key: 'jwt_token', value: token);
          return true;
        } else {
          throw Exception('Login successfully but have not seen token');
        }
      }
      return false;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is Map) {
        throw Exception(
          e.response?.data['message'] ?? 'Username or password is not correct!',
        );
      }
      throw Exception('Cannot connect to server!');
    }
  }

  Future<String> registerUser(RegisterRequest request) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: request.toJson(),
      );

      // Thử bóc tách trường 'message' từ JSON trả về (nếu Backend trả về {message: "..."})
      if (response.data is Map && response.data.containsKey('message')) {
        return response.data['message'];
      }

      // Fallback mặc định khi thành công
      return 'Register successfully!';
    } on DioException catch (e) {
      if (e.response != null) {
        // IN LỖI RA CONSOLE ĐỂ BẮT BỆNH
        print("=== [DEBUG] LỖI TỪ BACKEND: ${e.response?.data}");

        final data = e.response?.data;

        // BẮT LỖI 400 TỪ GLOBAL EXCEPTION HANDLER
        if (e.response?.statusCode == 400 && data is Map) {
          // 1. Kiểm tra lỗi logic nghiệp vụ (IllegalArgumentException từ Backend)
          // File GlobalExceptionHandler của bạn trả về: {"error": "..."}
          if (data.containsKey('error')) {
            throw Exception(data['error']);
          }

          // 2. Kiểm tra lỗi Validation từ DTO (@NotBlank, @Email...)
          // Spring Boot trả về danh sách lỗi. Ví dụ: {"email": "Lỗi 1", "phone": "Lỗi 2"}
          if (data.isNotEmpty) {
            // Lấy giá trị lỗi đầu tiên trong Map để hiển thị
            throw Exception(data.values.first.toString());
          }
        }

        // Bắt lỗi Validation kiểu cũ (trường hợp Spring Boot chưa config GlobalExceptionHandler chuẩn)
        if (data is Map &&
            data['errors'] != null &&
            (data['errors'] as List).isNotEmpty) {
          throw Exception(
            data['errors'][0]['defaultMessage'] ?? 'Data is not valid',
          );
        }

        // Bắt lỗi có chứa trường message (thường là lỗi 500 hoặc RuntimeException)
        if (data is Map && data['message'] != null) {
          throw Exception(data['message']);
        }

        // Nếu không rơi vào các trường hợp trên
        throw Exception('Server error: ${e.response?.statusCode}');
      } else {
        throw Exception('Cannot connect, please recheck internet!');
      }
    }
  }

  // --- HÀM LẤY THÔNG TIN PROFILE DỰA VÀO TOKEN ---
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      // 1. Mở két lấy Token
      String? token = await _storage.read(key: 'jwt_token');

      if (token == null || token.isEmpty) {
        throw Exception('You have not login yet or session has been over!');
      }

      // 2. Gửi request kèm Token lên API
      // LƯU Ý: Thay '/users/me' bằng đúng đường dẫn API lấy thông tin user bên Spring Boot của bạn
      final response = await _dio.get(
        '/users/me',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      return response.data; // Trả về cục JSON thông tin User
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        // Token sai hoặc hết hạn -> Xóa token cũ đi
        await _storage.delete(key: 'jwt_token');
        throw Exception('Session is over, please login again!');
      }
      throw Exception("Cannot fetch user's data!");
    }
  }

  // --- HÀM CẬP NHẬT PROFILE ---
  Future<String> updateUserProfile(Map<String, dynamic> updateData) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      if (token == null) throw Exception('Did not login!');

      final response = await _dio.put(
        '/users/me',
        data: updateData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      return response.data; // Trả về câu thông báo "Cập nhật thành công"
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Error when try to update data!');
    }
  }

  // --- HÀM XÁC THỰC EMAIL (OTP) ---
  Future<String> verifyEmail(String email, String otp) async {
    try {
      final response = await _dio.post(
        '/auth/verify-email',
        queryParameters: {'email': email, 'otp': otp},
      );
      return response.data; // Trả về câu thông báo thành công từ server
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Cannot connect, please try again!');
    }
  }

  // --- HÀM YÊU CẦU GỬI LẠI OTP ---
  Future<String> resendOtp(String email) async {
    try {
      final response = await _dio.post(
        '/auth/resend-otp',
        queryParameters: {'email': email},
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Cannot resend OTP!');
    }
  }

  // --- HÀM 1: YÊU CẦU QUÊN MẬT KHẨU (GỬI OTP) ---
  Future<String> forgotPassword(String email) async {
    try {
      final response = await _dio.post(
        '/auth/forgot-password',
        queryParameters: {'email': email},
      );
      return response.data; // Trả về câu "Mã xác thực đã được gửi..."
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Error when requesting forget-password!');
    }
  }

  // --- HÀM 2: ĐẶT LẠI MẬT KHẨU MỚI ---
  Future<String> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/reset-password',
        queryParameters: {
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        },
      );
      return response.data; // Trả về câu "Đổi mật khẩu thành công..."
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Error when reset password!');
    }
  }

  // --- HÀM KIỂM TRA OTP CHO LUỒNG QUÊN MẬT KHẨU ---
  Future<String> checkOtp(String email, String otp) async {
    try {
      final response = await _dio.post(
        '/auth/check-otp',
        queryParameters: {'email': email, 'otp': otp},
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('OTP is not valid!');
    }
  }

  // --- HÀM ĐỔI MẬT KHẨU BÊN TRONG PROFILE ---
  Future<String> changePassword(Map<String, String> data) async {
    try {
      String? token = await _storage.read(key: 'jwt_token');
      if (token == null) throw Exception('Did not login!');

      final response = await _dio.put(
        '/users/me/password',
        data: data,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data is String) {
        throw Exception(e.response?.data);
      }
      throw Exception('Error while changing password!');
    }
  }

  Future<dynamic> get(String endpoint, {Options? options}) async {
    // 👈 Thêm {Options? options}
    try {
      String? token = await _storage.read(key: 'jwt_token');

      // Nếu url bắt đầu bằng http (gọi GHN), ta dùng options truyền vào.
      // Nếu không, ta dùng Header Authorization mặc định của mình.
      final response = await _dio.get(
        endpoint.startsWith('http') ? endpoint : endpoint,
        options:
            options ?? Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data;
    } on DioException catch (e) {
      throw Exception("Lỗi: ${e.message}");
    }
  }

  List<ReviewModel> parseReviewList(String responseBody) {
    final List<dynamic> data = jsonDecode(responseBody);
    return data.map((e) => ReviewModel.fromJson(e)).toList();
  }

  ReviewSummaryModel parseReviewSummary(String responseBody) {
    final Map<String, dynamic> data = jsonDecode(responseBody);
    return ReviewSummaryModel.fromJson(data);
  }

  List<CommentModel> parseCommentList(String responseBody) {
    final List<dynamic> data = jsonDecode(responseBody);
    return data.map((e) => CommentModel.fromJson(e)).toList();
  }

  // =======================
  // GET REVIEWS BY PRODUCT
  // =======================
  Future<List<ReviewModel>> getReviewsByProduct(int productId) async {
    final response = await _dio.get('/reviews/product/$productId');
    return (response.data as List).map((e) => ReviewModel.fromJson(e)).toList();
  }

  // =======================
  // GET REVIEW SUMMARY
  // =======================
  Future<ReviewSummaryModel> getReviewSummary(int productId) async {
    final response = await _dio.get('/reviews/product/$productId/summary');
    return ReviewSummaryModel.fromJson(response.data);
  }

  // =======================
  // GET COMMENTS BY PRODUCT
  // =======================
  Future<List<CommentModel>> getCommentsByProduct(int productId) async {
    final response = await _dio.get('/comments/product/$productId');
    return (response.data as List)
        .map((e) => CommentModel.fromJson(e))
        .toList();
  }

  Future<void> postComment({
    required int productId,
    required String content,
    int? parentId,
    int? groupId,
  }) async {
    final token = await _storage.read(key: 'jwt_token');

    if (token == null || token.isEmpty) {
      throw Exception('Bạn chưa đăng nhập.');
    }

    await _dio.post(
      '/comments',
      data: {
        'productId': productId,
        'content': content,
        if (groupId != null) 'groupId': groupId,
        if (parentId != null) 'parentId': parentId,
      },
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  Future<OrderReviewPage> getOrderForReview(int orderId) async {
    final response = await _dio.get('/orders/$orderId/review');
    return OrderReviewPage.fromJson(response.data);
  }

  Future<void> submitOrderReviews(
    int orderId,
    Map<String, dynamic> payload,
  ) async {
    final token = await _storage.read(key: 'jwt_token');

    await _dio.post(
      '/orders/$orderId/reviews',
      data: payload,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  
}
