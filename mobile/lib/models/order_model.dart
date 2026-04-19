import 'order_item_model.dart';

class OrderModel {
  final int id;
  final String shippingName;
  final String shippingPhone;
  final String shippingAddress;
  final String? shippingNote;
  final double shippingFee;
  final double taxAmount;
  final double discountAmount;
  final double totalPayPrice;
  final String paymentMethod;
  final String paymentStatus;
  final String orderStatus;
  final DateTime? createdAt;
  final List<OrderItemModel> orderItems;

  OrderModel({
    required this.id,
    required this.shippingName,
    required this.shippingPhone,
    required this.shippingAddress,
    this.shippingNote,
    required this.shippingFee,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalPayPrice,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    this.createdAt,
    required this.orderItems,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? 0,
      shippingName: json['shippingName'] ?? '',
      shippingPhone: json['shippingPhone'] ?? '',
      shippingAddress: json['shippingAddress'] ?? '',
      shippingNote: json['shippingNote'],
      shippingFee: (json['shippingFee'] ?? 0.0).toDouble(),
      taxAmount: (json['taxAmount'] ?? 0.0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0.0).toDouble(),
      totalPayPrice: (json['totalPayPrice'] ?? 0.0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'COD',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      orderStatus: json['orderStatus'] ?? 'PENDING',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      orderItems: (json['orderItems'] as List? ?? [])
          .map((item) => OrderItemModel.fromJson(item))
          .toList(),
    );
  }
}