import 'cart_item_model.dart';

class CartModel {
  final List<CartItemModel> items;

  CartModel({required this.items});

  // Tính tổng tiền các món được chọn (Subtotal)
  double get subtotal => items
      .where((item) => item.isSelected)
      .fold(0, (sum, item) => sum + (item.price * item.quantity));

  // Tính tổng số lượng item để hiện icon badge
  int get totalItems => items.length;
}