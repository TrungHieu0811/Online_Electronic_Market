import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class OrderReviewScreen extends StatefulWidget {
  final int orderId;

  const OrderReviewScreen({super.key, required this.orderId});

  @override
  State<OrderReviewScreen> createState() => _OrderReviewScreenState();
}

class _OrderReviewScreenState extends State<OrderReviewScreen> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'http://10.0.2.2:8080/api',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  bool _isLoading = true;
  bool _isSubmitting = false;
  String _errorMessage = '';

  int? _orderId;
  String _status = '';
  List<OrderReviewItemModel> _items = [];

  final Map<int, int> _ratings = {};
  final Map<int, TextEditingController> _commentControllers = {};

  String get _baseImageUrl => 'http://10.0.2.2:8080/uploads';

  @override
  void initState() {
    super.initState();
    _fetchOrderForReview();
  }

  @override
  void dispose() {
    for (final controller in _commentControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchOrderForReview() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final token = await _storage.read(key: 'jwt_token');

      if (token == null || token.isEmpty) {
        throw Exception('You are not logged in.');
      }

      final response = await _dio.get(
        '/orders/${widget.orderId}/review',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final data = response.data as Map<String, dynamic>;
      final page = OrderReviewPageModel.fromJson(data);

      for (final item in page.items) {
        _ratings[item.id] = 0;
        _commentControllers[item.id] = TextEditingController();
      }

      if (!mounted) return;
      setState(() {
        _orderId = page.orderId;
        _status = page.status;
        _items = page.items;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _submitReviews() async {
    if (_items.isEmpty) return;

    final hasInvalidRating = _items.any((item) => (_ratings[item.id] ?? 0) < 1);

    if (hasInvalidRating) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a rating for all products.'),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = '';
    });

    try {
      final token = await _storage.read(key: 'jwt_token');

      if (token == null || token.isEmpty) {
        throw Exception('You are not logged in.');
      }

      final payload = {
        'reviews': _items.map((item) {
          return {
            'orderItemId': item.id,
            'productId': item.productId,
            'image': item.image,
            'rating': _ratings[item.id] ?? 0,
            'comment': _commentControllers[item.id]?.text.trim() ?? '',
          };
        }).toList(),
      };

      await _dio.post(
        '/orders/${widget.orderId}/reviews',
        data: payload,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reviews submitted successfully.')),
      );

      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _errorMessage.isNotEmpty
                ? _errorMessage
                : 'Failed to submit reviews.',
          ),
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  String _buildImageUrl(String image) {
    if (image.isEmpty) return '';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/')) return '$_baseImageUrl$image';
    return '$_baseImageUrl/$image';
  }

  Widget _buildStarSelector(int itemId) {
    final currentRating = _ratings[itemId] ?? 0;

    return Row(
      children: List.generate(5, (index) {
        final starValue = index + 1;
        return IconButton(
          onPressed: () {
            setState(() {
              _ratings[itemId] = starValue;
            });
          },
          icon: Icon(
            starValue <= currentRating ? Icons.star : Icons.star_border,
            color: const Color(0xFFf97316),
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
        );
      }),
    );
  }

  Widget _buildProductCard(OrderReviewItemModel item) {
    final imageUrl = _buildImageUrl(item.image);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(
                              Icons.image_not_supported_outlined,
                              color: Colors.grey,
                            );
                          },
                        )
                      : const Icon(
                          Icons.image_not_supported_outlined,
                          color: Colors.grey,
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name.isNotEmpty ? item.name : 'Product',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (item.variant.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        item.variant,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      'Product ID: ${item.productId}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Your Rating',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 8),
          _buildStarSelector(item.id),
          const SizedBox(height: 12),
          const Text(
            'Your Comment',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _commentControllers[item.id],
            minLines: 3,
            maxLines: 5,
            decoration: InputDecoration(
              hintText: 'Write your review...',
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.all(14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(14)),
                borderSide: BorderSide(color: Color(0xFF045fae)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF045fae);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        title: const Text(
          'Review Order',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty && _items.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  _errorMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            )
          : _items.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'This order has no items to review.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _fetchOrderForReview,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Order #EM-${_orderId ?? widget.orderId}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Status: ${_status.isNotEmpty ? _status : 'DELIVERED'}',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${_items.length} product(s) ready for review',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ..._items.map(_buildProductCard),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(
                        top: BorderSide(color: Colors.grey.shade200),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 10,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      top: false,
                      child: SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submitReviews,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Submit All Reviews',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class OrderReviewPageModel {
  final int orderId;
  final String status;
  final List<OrderReviewItemModel> items;

  OrderReviewPageModel({
    required this.orderId,
    required this.status,
    required this.items,
  });

  factory OrderReviewPageModel.fromJson(Map<String, dynamic> json) {
    return OrderReviewPageModel(
      orderId: json['orderId'] ?? 0,
      status: json['status'] ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => OrderReviewItemModel.fromJson(e))
          .toList(),
    );
  }
}

class OrderReviewItemModel {
  final int id;
  final int productId;
  final String name;
  final String variant;
  final String image;

  OrderReviewItemModel({
    required this.id,
    required this.productId,
    required this.name,
    required this.variant,
    required this.image,
  });

  factory OrderReviewItemModel.fromJson(Map<String, dynamic> json) {
    return OrderReviewItemModel(
      id: json['id'] ?? 0,
      productId: json['productId'] ?? 0,
      name: json['name'] ?? '',
      variant: json['variant'] ?? '',
      image: json['image'] ?? '',
    );
  }
}
