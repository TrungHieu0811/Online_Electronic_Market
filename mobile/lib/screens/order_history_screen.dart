import 'package:electromart_flutter/screens/order_review_screen.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';

import '../services/order_service_user.dart';
import '../models/order_model.dart';
import '../models/order_item_model.dart';
import 'order_detail_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  final OrderServiceUser _orderService = OrderServiceUser();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'http://10.0.2.2:8080/api',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  late Future<List<OrderModel>> _ordersFuture;
  final TextEditingController _searchController = TextEditingController();

  final Map<int, bool> _reviewableMap = {};

  String _searchKeyword = "";
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _ordersFuture = _fetchOrders();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<List<OrderModel>> _fetchOrders() async {
    try {
      final response = await _orderService.getMyOrders();
      final List<dynamic> data = response['content'] ?? [];
      final orders = data.map((json) => OrderModel.fromJson(json)).toList();

      await _loadReviewableMap(orders);

      return orders;
    } catch (e) {
      throw Exception("Failed to load order history: $e");
    }
  }

  Future<void> _loadReviewableMap(List<OrderModel> orders) async {
    _reviewableMap.clear();

    final deliveredOrders = orders
        .where((order) => order.orderStatus.toUpperCase() == 'DELIVERED')
        .toList();

    if (deliveredOrders.isEmpty) return;

    final results = await Future.wait(
      deliveredOrders.map((order) async {
        final needsReview = await _checkOrderNeedsReview(order.id);
        return MapEntry(order.id, needsReview);
      }),
    );

    for (final entry in results) {
      _reviewableMap[entry.key] = entry.value;
    }
  }

  Future<bool> _checkOrderNeedsReview(int orderId) async {
    try {
      final token = await _storage.read(key: 'jwt_token');

      if (token == null || token.isEmpty) {
        return false;
      }

      final response = await _dio.get(
        '/orders/$orderId/review',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final data = response.data;
      final items = data is Map<String, dynamic> ? data['items'] : null;

      return items is List && items.isNotEmpty;
    } catch (e) {
      debugPrint('Failed to check review status for order $orderId: $e');
      return false;
    }
  }

  Future<void> _refreshOrders() async {
    setState(() {
      _ordersFuture = _fetchOrders();
    });
  }

  Future<void> _openOrderDetail(OrderModel order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => OrderDetailScreen(order: order)),
    );

    if (result == true) {
      await _refreshOrders();
    }
  }

  Future<void> _openReviewPlaceholder(OrderModel order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OrderReviewScreen(orderId: order.id),
      ),
    );

    if (result == true) {
      await _refreshOrders();
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

  bool _hasPendingReview(OrderModel order) {
    if (order.orderStatus.toUpperCase() != 'DELIVERED') return false;
    return _reviewableMap[order.id] == true;
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
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
                    hintText: "Search by product name...",
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
              Tab(text: "Need Review"),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrderList('ALL'),
            _buildOrderList('PENDING'),
            _buildOrderList('DELIVERED'),
            _buildOrderList('CANCELLED'),
            _buildOrderList('NEED_REVIEW'),
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

        if (snapshot.hasError) {
          return Center(child: Text("Error: ${snapshot.error}"));
        }

        var orders = snapshot.data ?? [];

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
        } else if (filterStatus == 'NEED_REVIEW') {
          orders = orders.where((o) => _hasPendingReview(o)).toList();
        }

        if (_searchKeyword.isNotEmpty) {
          orders = orders.where((order) {
            return order.orderItems.any(
              (item) => item.variantName.toLowerCase().contains(_searchKeyword),
            );
          }).toList();
        }

        if (orders.isEmpty) {
          final emptyMessage = filterStatus == 'NEED_REVIEW'
              ? "No orders need review yet."
              : "No orders found.";

          return Center(child: Text(emptyMessage));
        }

        return RefreshIndicator(
          onRefresh: _refreshOrders,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) => _buildOrderCard(orders[index]),
          ),
        );
      },
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final bool hasPendingReview = _hasPendingReview(order);

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
              Expanded(
                child: Row(
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
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Order #EM-${order.id}",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "${order.createdAt != null ? DateFormat('MMM dd, yyyy').format(order.createdAt!) : 'N/A'} • ${order.orderItems.length} item(s)",
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _buildStatusBadge(order.orderStatus),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  "\$${order.totalPayPrice.toStringAsFixed(2)}",
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1E293B),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (hasPendingReview)
                    OutlinedButton.icon(
                      onPressed: () => _openReviewPlaceholder(order),
                      icon: const Icon(Icons.rate_review_outlined, size: 18),
                      label: const Text("Review"),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF045fae),
                        side: const BorderSide(color: Color(0xFF045fae)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ElevatedButton(
                    onPressed: () => _openOrderDetail(order),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF045fae),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text("View Details"),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final Color color = _getStatusColor(status);

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
            const Text(
              "Order Items",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: order.orderItems.length,
                itemBuilder: (context, i) {
                  final OrderItemModel item = order.orderItems[i];
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
