class OrderItemModel {
  final int id;
  final int productId;
  final String variantName;
  final String? imageUrl;
  final int quantity;
  final double priceAtPurchase;
  final double taxRateAtPurchase;

  OrderItemModel({
    required this.id,
    required this.productId,
    required this.variantName,
    this.imageUrl,
    required this.quantity,
    required this.priceAtPurchase,
    this.taxRateAtPurchase = 0.1,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final product = json['product'] ?? {};
    return OrderItemModel(
      id: json['id'] ?? 0,
      productId: product['id'] ?? 0,
      variantName: product['variantName'] ?? 'Unknown',
      imageUrl: json['imageUrl'],
      quantity: json['quantity'] ?? 0,
      priceAtPurchase: (json['priceAtPurchase'] ?? 0.0).toDouble(),
      taxRateAtPurchase: (json['taxRateAtPurchase'] ?? 0.1).toDouble(),
    );
  }
}