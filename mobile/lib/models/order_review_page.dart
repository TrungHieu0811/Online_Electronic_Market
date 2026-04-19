import 'package:electromart_flutter/models/order_review_item.dart';

class OrderReviewPage {
  final int orderId;
  final String status;
  final List<OrderReviewItem> items;

  OrderReviewPage({
    required this.orderId,
    required this.status,
    required this.items,
  });

  factory OrderReviewPage.fromJson(Map<String, dynamic> json) {
    return OrderReviewPage(
      orderId: json['orderId'],
      status: json['status'] ?? '',
      items: (json['items'] as List)
          .map((e) => OrderReviewItem.fromJson(e))
          .toList(),
    );
  }
}
