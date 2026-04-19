import 'user_simple_model.dart';

class ReviewModel {
  final int? id;

  final int? productId;
  final String? productName;
  final String? productThumbnail;

  final int? ratingScore;
  final String? comment;
  final String? imageUrl;
  final String? status;

  final DateTime? createdAt;

  final UserSimpleModel? user;

  final String? sentiment;
  final String? sentimentExplanation;

  ReviewModel({
    this.id,
    this.productId,
    this.productName,
    this.productThumbnail,
    this.ratingScore,
    this.comment,
    this.imageUrl,
    this.status,
    this.createdAt,
    this.user,
    this.sentiment,
    this.sentimentExplanation,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] as int?,
      productId: json['productId'] as int?,
      productName: json['productName'] as String?,
      productThumbnail: json['productThumbnail'] as String?,
      ratingScore: json['ratingScore'] as int?,
      comment: json['comment'] as String?,
      imageUrl: json['imageUrl'] as String?,
      status: json['status'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: json['user'] != null
          ? UserSimpleModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      sentiment: json['sentiment'] as String?,
      sentimentExplanation: json['sentimentExplanation'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'productThumbnail': productThumbnail,
      'ratingScore': ratingScore,
      'comment': comment,
      'imageUrl': imageUrl,
      'status': status,
      'createdAt': createdAt?.toIso8601String(),
      'user': user?.toJson(),
      'sentiment': sentiment,
      'sentimentExplanation': sentimentExplanation,
    };
  }
}
