class CartItemModel {
  final int id;
  final int productId;
  final String variantName;
  final String? imageUrl;
  final double price; // Backend dùng salePrice
  final String? slug;
  final int? stockQuantity;
  int quantity;
  bool isSelected;

  CartItemModel({
    required this.id,
    required this.productId,
    required this.variantName,
    this.imageUrl,
    this.slug,
    this.stockQuantity,
    required this.price,
    required this.quantity,
    required this.isSelected,
  });

  // Hàm chuyển đổi từ JSON (Java Entity) sang Flutter Model
  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    // Lưu ý: Dữ liệu product nằm trong object 'product' của CartItem
    final product = json['product'] ?? {};
    
    return CartItemModel(
      id: json['id'],
      productId: product['id'] ?? 0,
      variantName: product['variantName'] ?? 'Unknown Product',
      imageUrl: json['imageUrl'], // Ưu tiên imageUrl lưu trong CartItem
      price: (product['salePrice'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] ?? 1,
      slug: json['slug'] ?? (json['product'] != null ? json['product']['slug'] : null),
      isSelected: json['isSelected'] ?? true, // Khớp với trường is_selected
      stockQuantity: json['product'] != null ? json['product']['stockQuantity'] : json['stockQuantity'],
    );
  }

  // Hàm chuyển ngược lại JSON nếu cần gửi lên API Update
 Map<String, dynamic> toJson() {
  return {
    'id': id,
    'productId': productId,
    'variantName': variantName,
    'imageUrl': imageUrl,
    'price': price,
    'quantity': quantity,
    'isSelected': isSelected,
  };
}
}