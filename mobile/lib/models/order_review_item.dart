class OrderReviewItem {
  final int id;
  final int productId;
  final String name;
  final String variant;
  final String image;

  OrderReviewItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.variant,
    required this.image,
  });

  factory OrderReviewItem.fromJson(Map<String, dynamic> json) {
    return OrderReviewItem(
      id: json['id'],
      productId: json['productId'],
      name: json['name'] ?? '',
      variant: json['variant'] ?? '',
      image: json['image'] ?? '',
    );
  }
}
