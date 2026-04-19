import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/comment_notification_model.dart';

class CommentNotificationService {
  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:8080/api'));

  Future<String?> _getToken() async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'jwt_token');
    debugPrint('NOTI TOKEN = $token');
    return token;
  }

  Future<List<CommentNotificationModel>> getMyCommentNotifications() async {
    final token = await _getToken();

    if (token == null || token.isEmpty) {
      throw Exception('Token null');
    }

    try {
      final response = await _dio.get(
        '/notifications/comments',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      debugPrint('NOTI STATUS = ${response.statusCode}');
      debugPrint('NOTI DATA = ${response.data}');

      final data = response.data;

      if (data is List) {
        return data.map((e) => CommentNotificationModel.fromJson(e)).toList();
      }

      return [];
    } on DioException catch (e) {
      debugPrint('NOTI ERROR STATUS = ${e.response?.statusCode}');
      debugPrint('NOTI ERROR DATA = ${e.response?.data}');
      debugPrint('NOTI ERROR MESSAGE = ${e.message}');
      rethrow;
    }
  }

  Future<void> markCommentNotificationAsRead(int notificationId) async {
    final token = await _getToken();

    if (token == null || token.isEmpty) {
      throw Exception('Token null');
    }

    await _dio.put(
      '/notifications/comments/$notificationId/read',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  Future<void> markAllCommentNotificationsAsRead() async {
    final token = await _getToken();

    if (token == null || token.isEmpty) {
      throw Exception('Token null');
    }

    await _dio.put(
      '/notifications/comments/read-all',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }
}
