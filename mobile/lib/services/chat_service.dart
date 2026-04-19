import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ChatService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://10.0.2.2:8080/api/public', // Đường dẫn API public chat
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  final _storage = const FlutterSecureStorage();

  Future<Options> _getAuthOptions() async {
    String? token = await _storage.read(key: 'jwt_token');
    return Options(headers: {
      if (token != null) 'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    });
  }

  Future<String> sendMessage(String message) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/chat',
        data: {'message': message},
        options: options,
      );
      // Backend trả về chuỗi String (nội dung từ Gemini)
      return response.data.toString();
    } on DioException catch (e) {
      return "Error: ${e.response?.data ?? "Connection failed"}";
    }
  }
}