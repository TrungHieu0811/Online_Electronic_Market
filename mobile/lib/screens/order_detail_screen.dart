import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../services/order_service_user.dart'; // Sử dụng đúng service đã có hàm cancel
import 'package:intl/intl.dart';

class OrderDetailScreen extends StatefulWidget {
  final OrderModel order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  // Đổi sang OrderServiceUser để sử dụng hàm cancelOrder
  final OrderServiceUser _orderService = OrderServiceUser();
  late String _currentStatus;
  bool _isCancelling = false;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.orderStatus.toUpperCase();
  }

  Future<void> _handleCancelOrder() async {
    setState(() => _isCancelling = true);
    try {
      final String message = await _orderService.cancelOrder(widget.order.id);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
        setState(() {
          _currentStatus = 'CANCELLED';
          _isCancelling = false;
        });

        // TỰ ĐỘNG QUAY VỀ TRANG TRƯỚC VÀ GỬI TÍN HIỆU CẬP NHẬT
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) Navigator.pop(context, true);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error: ${e.toString()}"),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isCancelling = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isDelivered = _currentStatus == 'DELIVERED';
    bool canCancel =
        _currentStatus == 'PENDING' || _currentStatus == 'CONFIRMED';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          "ORDER SUMMARY",
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () {
            // Nếu trạng thái hiện tại là CANCELLED thì trả về true, ngược lại trả về false
            Navigator.pop(context, _currentStatus == 'CANCELLED');
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header & Delivery Date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "ID: #${widget.order.id}",
                      style: const TextStyle(
                        color: Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "PLACED: ${widget.order.createdAt != null ? DateFormat('MMM dd, yyyy, hh:mm a').format(widget.order.createdAt!) : 'N/A'}",
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                    if (isDelivered)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          "DELIVERY DATE: ${DateFormat('MMM dd, yyyy').format(DateTime.now())}",
                          style: const TextStyle(
                            color: Colors.green,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                _buildStatusBadge(_currentStatus),
              ],
            ),
            const SizedBox(height: 30),

            // 2. Product Information
            const Text(
              "PRODUCT INFORMATION",
              style: TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const Divider(),
            ...widget.order.orderItems.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Row(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: Colors.grey.shade100),
                        image: DecorationImage(
                          image: NetworkImage(
                            (item.imageUrl == null ||
                                    item.imageUrl!.isEmpty ||
                                    item.imageUrl == "no image")
                                ? "https://via.placeholder.com/150"
                                : (item.imageUrl!.startsWith("http")
                                      ? item.imageUrl!
                                      : "http://10.0.2.2:8080/uploads/${item.imageUrl!.startsWith("/") ? item.imageUrl!.substring(1) : item.imageUrl!}"),
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.variantName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            "\$${item.priceAtPurchase} / UNIT",
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      "${item.quantity}",
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(width: 15),
                    Text(
                      "\$${(item.quantity * item.priceAtPurchase).toStringAsFixed(2)}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),

            // 3. Shipping To (Row)
            const Text(
              "SHIPPING TO",
              style: TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Colors.white,
                    child: Icon(Icons.location_on, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.order.shippingName,
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                        Text(
                          widget.order.shippingAddress,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          "Tel: ${widget.order.shippingPhone}",
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // 4. Payment Summary (Dark style)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Column(
                children: [
                  _buildSummaryLine(
                    "SUBTOTAL",
                    "\$${(widget.order.totalPayPrice + widget.order.discountAmount - widget.order.shippingFee).toStringAsFixed(2)}",
                  ),
                  _buildSummaryLine(
                    "SHIPPING FEE",
                    widget.order.shippingFee == 0
                        ? "FREE"
                        : "\$${widget.order.shippingFee.toStringAsFixed(2)}",
                    valueColor: widget.order.shippingFee == 0
                        ? Colors.green
                        : Colors.white,
                  ),
                  if (widget.order.discountAmount > 0)
                    _buildSummaryLine(
                      "DISCOUNT",
                      "-\$${widget.order.discountAmount.toStringAsFixed(2)}",
                      valueColor: Colors.redAccent,
                    ),
                  const Divider(color: Colors.white10, height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "TOTAL AMOUNT",
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "\$${widget.order.totalPayPrice.toStringAsFixed(2)}",
                        style: const TextStyle(
                          color: Color(0xFFFB923C),
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 35),

            // 5. Cancel Button
            if (canCancel)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isCancelling
                      ? null
                      : () => _showCancelConfirmation(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFF1F2),
                    foregroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                      side: const BorderSide(color: Color(0xFFFFE4E6)),
                    ),
                  ),
                  child: _isCancelling
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.red,
                          ),
                        )
                      : const Text(
                          "CANCEL ORDER",
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showCancelConfirmation() {
    // Xác định nội dung thông báo dựa trên phương thức thanh toán
    String confirmationMessage;

    if (widget.order.paymentMethod.toUpperCase() == 'PAYPAL') {
      confirmationMessage =
          "Are you sure you want to cancel this order? Since you paid via PayPal, the total amount will be automatically refunded to your PayPal account.";
    } else {
      confirmationMessage =
          "Are you sure you want to cancel this order? This action cannot be undone.";
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Confirm Cancellation"),
        content: Text(confirmationMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("No, Keep Order"),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _handleCancelOrder();
            },
            child: const Text(
              "Yes, Cancel Order",
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryLine(
    String label,
    String value, {
    Color valueColor = Colors.white,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white60,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color badgeColor = status == 'DELIVERED'
        ? Colors.green.shade100
        : status == 'CANCELLED'
        ? Colors.red.shade100
        : const Color(0xFFFEF3C7);
    Color textColor = status == 'DELIVERED'
        ? Colors.green
        : status == 'CANCELLED'
        ? Colors.red
        : const Color(0xFFD97706);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 10,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
