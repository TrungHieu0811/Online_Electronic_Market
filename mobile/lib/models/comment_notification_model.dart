class CommentNotificationModel {
  final int id;
  final String? title;
  final String? message;
  final int productId;
  final int commentId;
  final bool isRead;
  final DateTime? createdAt;

  CommentNotificationModel({
    required this.id,
    this.title,
    this.message,
    required this.productId,
    required this.commentId,
    required this.isRead,
    this.createdAt,
  });

  factory CommentNotificationModel.fromJson(Map<String, dynamic> json) {
    return CommentNotificationModel(
      id: json['id'],
      title: json['title'],
      message: json['message'],
      productId: json['productId'],
      commentId: json['commentId'],
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  CommentNotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    int? productId,
    int? commentId,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return CommentNotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      productId: productId ?? this.productId,
      commentId: commentId ?? this.commentId,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
