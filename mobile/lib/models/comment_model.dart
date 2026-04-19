import 'user_simple_model.dart';

class CommentModel {
  final int? id;
  final int? parentId;

  final String? content;
  final bool? isAdminReply;
  final bool? isReadByAdmin;

  final DateTime? adminReadAt;
  final DateTime? createdAt;

  final UserSimpleModel? user;

  final List<CommentModel> replies;

  CommentModel({
    this.id,
    this.parentId,
    this.content,
    this.isAdminReply,
    this.isReadByAdmin,
    this.adminReadAt,
    this.createdAt,
    this.user,
    this.replies = const [],
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as int?,
      parentId: json['parentId'] as int?,
      content: json['content'] as String?,
      isAdminReply: json['isAdminReply'] as bool?,
      isReadByAdmin: json['isReadByAdmin'] as bool?,
      adminReadAt: json['adminReadAt'] != null
          ? DateTime.tryParse(json['adminReadAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: json['user'] != null
          ? UserSimpleModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      replies: json['replies'] != null
          ? (json['replies'] as List)
                .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
                .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parentId': parentId,
      'content': content,
      'isAdminReply': isAdminReply,
      'isReadByAdmin': isReadByAdmin,
      'adminReadAt': adminReadAt?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'user': user?.toJson(),
      'replies': replies.map((e) => e.toJson()).toList(),
    };
  }
}
