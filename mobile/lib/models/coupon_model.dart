import 'dart:convert';

class CouponModel {
  final int id;
  final String code;
  final String description;
  final String discountType; // "FIXED" hoặc "PERCENTAGE"
  final double discountValue;
  final double? maxDiscountAmount;
  final double minOrderValue;
  final int usageLimit;
  final int usedCount;
  final int perUserLimit;
  final DateTime? startDate;
  final DateTime? endDate;
  final String status;

  CouponModel({
    required this.id,
    required this.code,
    required this.description,
    required this.discountType,
    required this.discountValue,
    this.maxDiscountAmount,
    this.minOrderValue = 0.0,
    required this.usageLimit,
    this.usedCount = 0,
    this.perUserLimit = 1,
    this.startDate,
    this.endDate,
    required this.status,
  });

  // Hàm chuyển đổi từ JSON (API) sang Object Flutter
  factory CouponModel.fromJson(Map<String, dynamic> json) {
    return CouponModel(
      id: json['id'],
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      discountType: json['discountType'] ?? 'FIXED',
      discountValue: (json['discountValue'] as num).toDouble(),
      maxDiscountAmount: json['maxDiscountAmount'] != null 
          ? (json['maxDiscountAmount'] as num).toDouble() : null,
      minOrderValue: (json['minOrderValue'] as num).toDouble(),
      usageLimit: json['usageLimit'] ?? 0,
      usedCount: json['usedCount'] ?? 0,
      perUserLimit: json['perUserLimit'] ?? 1,
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      status: json['status'] ?? 'ACTIVE',
    );
  }
}