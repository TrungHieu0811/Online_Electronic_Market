import 'package:flutter/material.dart';
import '../services/order_service_user.dart';
import '../models/order_model.dart';
import '../models/order_item_model.dart';
import 'package:intl/intl.dart';
import 'order_detail_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  final OrderServiceUser _orderService = OrderServiceUser();

  // Quản lý dữ liệu và trạng thái tìm kiếm
  late Future<List<OrderModel>> _ordersFuture;
  final TextEditingController _searchController = TextEditingController();
  String _searchKeyword = "";
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _ordersFuture = _fetchOrders();
  }

  // Hàm lấy dữ liệu và sửa lỗi subtype
  Future<List<OrderModel>> _fetchOrders() async {
    try {
      final response = await _orderService.getMyOrders();
      final List<dynamic> data = response['content'] ?? [];
      return data.map((json) => OrderModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception("Không thể tải danh sách đơn hàng: $e");
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      case 'CONFIRMED':
        return Colors.blue;
      case 'SHIPPING':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4, // Gồm: All, In Progress, Completed, Cancelled
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F9FB),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: Icon(
              _isSearching ? Icons.close : Icons.arrow_back,
              color: const Color(0xFF045fae),
            ),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchKeyword = "";
                  _searchController.clear();
                } else {
                  Navigator.pop(context);
                }
              });
            },
          ),
          title: _isSearching
              ? TextField(
                  controller: _searchController,
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: "Tìm theo tên sản phẩm...",
                    border: InputBorder.none,
                  ),
                  onChanged: (value) =>
                      setState(() => _searchKeyword = value.toLowerCase()),
                )
              : const Text(
                  "Order History",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
          actions: [
            if (!_isSearching)
              IconButton(
                icon: const Icon(Icons.search, color: Colors.black54),
                onPressed: () => setState(() => _isSearching = true),
              ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: Color(0xFF045fae),
            labelColor: Color(0xFF045fae),
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: "All Orders"),
              Tab(text: "In Progress"),
              Tab(text: "Completed"),
              Tab(text: "Cancelled"),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrderList('ALL'),
            _buildOrderList('PENDING'),
            _buildOrderList('DELIVERED'),
            _buildOrderList('CANCELLED'),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderList(String filterStatus) {
    return FutureBuilder<List<OrderModel>>(
      future: _ordersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError)
          return Center(child: Text("Error: ${snapshot.error}"));

        var orders = snapshot.data ?? [];

        // 1. Lọc theo Tab trạng thái
        if (filterStatus == 'DELIVERED') {
          orders = orders.where((o) => o.orderStatus == 'DELIVERED').toList();
        } else if (filterStatus == 'PENDING') {
          orders = orders
              .where(
                (o) =>
                    o.orderStatus != 'DELIVERED' &&
                    o.orderStatus != 'CANCELLED',
              )
              .toList();
        } else if (filterStatus == 'CANCELLED') {
          orders = orders.where((o) => o.orderStatus == 'CANCELLED').toList();
        }

        // 2. Logic tìm kiếm sản phẩm trong đơn hàng
        if (_searchKeyword.isNotEmpty) {
          orders = orders.where((order) {
            return order.orderItems.any(
              (item) => item.variantName.toLowerCase().contains(_searchKeyword),
            );
          }).toList();
        }

        if (orders.isEmpty) {
          return const Center(child: Text("No orders found."));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: orders.length,
          itemBuilder: (context, index) => _buildOrderCard(orders[index]),
        );
      },
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      order.orderStatus == 'DELIVERED'
                          ? Icons.inventory_2
                          : Icons.local_shipping,
                      color: const Color(0xFF045fae),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Order #EM-${order.id}",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${order.createdAt != null ? DateFormat('MMM dd, yyyy').format(order.createdAt!) : 'N/A'} • ${order.orderItems.length} Items",
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              _buildStatusBadge(order.orderStatus),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Hiển thị giá tiền chính xác từ model
              Text(
                "\$${order.totalPayPrice.toStringAsFixed(2)}",
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  // 1. Chờ trang Detail đóng lại và nhận kết quả
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => OrderDetailScreen(order: order),
                    ),
                  );

                  // 2. Nếu kết quả trả về là true, load lại danh sách đơn hàng
                  if (result == true) {
                    setState(() {
                      // SỬA TẠI ĐÂY: Thay _orderService.getMyOrders() bằng _fetchOrders()
                      _ordersFuture = _fetchOrders();
                    });
                  }
                },
                child: const Text("View Details"),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 10,
        ),
      ),
    );
  }

  void _showOrderItems(OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        height: MediaQuery.of(context).size.height * 0.6,
        child: Column(
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Text(
              "Order Items",
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: order.orderItems.length,
                itemBuilder: (context, i) {
                  final item = order.orderItems[i];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(
                      Icons.shopping_bag_outlined,
                      color: Color(0xFF045fae),
                    ),
                    title: Text(
                      item.variantName,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text("Quantity: ${item.quantity}"),
                    trailing: Text(
                      "\$${(item.quantity * item.priceAtPurchase).toStringAsFixed(2)}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
