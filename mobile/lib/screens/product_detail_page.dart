import 'package:electromart_flutter/models/comment_model.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/models/review_model.dart';
import 'package:electromart_flutter/models/review_summary_model.dart';
import 'package:electromart_flutter/screens/checkout_page.dart';
import 'package:electromart_flutter/screens/login_screen.dart';
import 'package:electromart_flutter/screens/main_page.dart';
import 'package:electromart_flutter/services/cart_service.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';

class ProductDetailPage extends StatefulWidget {
  final String slug;

  const ProductDetailPage({super.key, required this.slug});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  final Color primaryColor = const Color(0xFF045fae);
  final Color accentColor = const Color(0xFFf97316);
  final Color bgColor = const Color(0xFFf5f7f8);

  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:8080/api/public'));
  final ApiService _apiService = ApiService();

  ProductDetailModel? _product;
  ReviewSummaryModel? _reviewSummary;
  List<ReviewModel> _reviews = [];
  List<CommentModel> _comments = [];

  bool _isLoading = true;
  bool _isReviewLoading = true;
  bool _isCommentLoading = true;
  bool _isPostingComment = false;

  int? _replyingToCommentId;
  String? _replyingToUsername;
  int? _currentUserId;

  String? _errorMessage;
  int _currentImageIndex = 0;
  String? _token;
  int _cartCount = 0;

  bool _showAllComments = false;
  bool _showAllReviews = false;
  final Set<int> _expandedReplyThreads = {};

  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadToken();
    _initUser();
    _fetchAllData();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _initUser() async {
    try {
      final userData = await _apiService.getUserProfile();
      if (!mounted) return;

      setState(() {
        _currentUserId = userData['id'] as int?;
      });
    } catch (e) {
      debugPrint('Không lấy được current user: $e');
    }
  }

  Future<void> _fetchAllData() async {
    try {
      final response = await _dio.get('/products/${widget.slug}');
      final product = ProductDetailModel.fromJson(response.data);

      debugPrint('Current product slug: ${widget.slug}');
      debugPrint('Current product id: ${product.id}');
      debugPrint('Current product name: ${product.variantName}');

      setState(() {
        _product = product;
        _isLoading = false;
      });

      await Future.wait([
        _fetchReviews(product.id),
        _fetchComments(product.id),
      ]);
    } catch (e) {
      setState(() {
        _errorMessage = "Failed to load product details.";
        _isLoading = false;
      });
    }
  }

  Future<void> _loadToken() async {
    const storage = FlutterSecureStorage();
    String? savedToken = await storage.read(key: 'jwt_token');
    setState(() {
      _token = savedToken;
    });
  }

  Future<void> _loadCartCount() async {
    try {
      const storage = FlutterSecureStorage();
      String? token = await storage.read(key: 'jwt_token');

      int count = 0;
      if (token != null) {
        final cartData = await CartService().getMyCart(token);
        count = cartData.length;
      } else {
        final guestData = await CartService().getGuestCart();
        count = guestData.length;
      }

      setState(() {
        _cartCount = count;
      });
    } catch (e) {
      print("Lỗi load số lượng: $e");
    }
  }

  void _showQuantitySheet({required bool isBuyNow}) {
    int localQuantity = 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            _product!.images[0],
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _product!.variantName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 5),
                            Text(
                              "\$${(_product!.salePrice ?? _product!.basePrice).toStringAsFixed(2)}",
                              style: TextStyle(
                                color: accentColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Select Quantity",
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Row(
                        children: [
                          _buildQtyBtn(Icons.remove, () {
                            if (localQuantity > 1) {
                              setSheetState(() => localQuantity--);
                            }
                          }),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 15),
                            child: Text(
                              "$localQuantity",
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          _buildQtyBtn(Icons.add, () {
                            setSheetState(() => localQuantity++);
                          }),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        if (isBuyNow) {
                          _onConfirmBuyNow(localQuantity);
                        } else {
                          _onConfirmAddToCart(localQuantity);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isBuyNow ? accentColor : primaryColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        isBuyNow
                            ? "PROCEED TO CHECKOUT"
                            : "CONFIRM ADD TO CART",
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showLoginRequiredDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Login Required"),
        content: const Text(
          "You need to login to use the 'Buy Now' feature. Do you want to login now?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("CANCEL", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: accentColor),
            child: const Text("LOGIN NOW"),
          ),
        ],
      ),
    );
  }

  void _onConfirmAddToCart(int quantity) async {
    const storage = FlutterSecureStorage();
    String? token = await storage.read(key: 'jwt_token');

    bool success = false;

    if (token != null) {
      success = await CartService().addToCart(_product!.id, quantity, token);
    } else {
      success = await CartService().addToGuestCart(_product!, quantity);
    }


    // 3. Thông báo cho người dùng
  if (success) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(token != null 
          ? "Added to your account cart!" 
          : "Added to local cart (Guest)!"),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );

    // Chuyển hướng về trang giỏ hàng để khách kiểm tra
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (context) => const MainPage(initialIndex: 4), // 4 thường là Tab Cart của bé
      ),
      (route) => false,
    );
  } else {
    // Xử lý khi lỗi (ví dụ: sản phẩm hết hàng)
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Failed to add to cart. Please try again."),
        backgroundColor: Colors.red,
      ),
    );
  }
  }

  void _onConfirmBuyNow(int quantity) async {
    if (_token == null) {
      _showLoginRequiredDialog();
      return;
    }

    setState(() => _isLoading = true);

    // bool success = await CartService().addToCart(
    //   _product!.id,
    //   quantity,
    //   _token!,
    // );

    // if (success) {
      final buyNowItem = CartItemModel(
        id: 0,
        productId: _product!.id,
        variantName: _product!.variantName,
        imageUrl: _product!.images.isNotEmpty ? _product!.images.first : '',
        price: _product!.salePrice ?? _product!.basePrice,
        quantity: quantity,
        isSelected: true,
      );

      double subtotal = buyNowItem.price * quantity;
      double shipping = subtotal >= 1500 ? 0.0 : 15.0;
      double tax = subtotal * 0.1;
      double total = subtotal + shipping + tax;

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CheckoutPage(
              selectedItems: [buyNowItem],
              subtotal: subtotal,
              shippingFee: shipping,
              totalAmount: total,
            ),
          ),
        );
      }
    
    setState(() => _isLoading = false);
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18),
      ),
    );
  }

  Future<void> _fetchReviews(int productId) async {
    try {
      final summary = await _apiService.getReviewSummary(productId);
      final reviews = await _apiService.getReviewsByProduct(productId);

      if (!mounted) return;
      setState(() {
        _reviewSummary = summary;
        _reviews = reviews;
        _isReviewLoading = false;
        _showAllReviews = false;
      });
    } catch (e) {
      debugPrint('Error loading reviews: $e');
      if (!mounted) return;
      setState(() {
        _isReviewLoading = false;
      });
    }
  }

  Future<void> _fetchComments(int productId) async {
    try {
      final comments = await _apiService.getCommentsByProduct(productId);

      if (!mounted) return;
      setState(() {
        _comments = comments;
        _isCommentLoading = false;
        _showAllComments = false;
        _expandedReplyThreads.clear();
      });
    } catch (e) {
      debugPrint('Error loading comments: $e');
      if (!mounted) return;
      setState(() {
        _isCommentLoading = false;
      });
    }
  }

  Future<void> _submitComment() async {
    if (_product == null) return;

    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    setState(() {
      _isPostingComment = true;
    });

    try {
      await _apiService.postComment(
        productId: _product!.id,
        content: content,
        parentId: _replyingToCommentId,
      );

      _commentController.clear();

      setState(() {
        _replyingToCommentId = null;
        _replyingToUsername = null;
      });

      await _fetchComments(_product!.id);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment posted successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isPostingComment = false;
      });
    }
  }

  String _formatPrice(double value) {
    return "\$${value.toStringAsFixed(2)}";
  }

  String _timeAgo(DateTime? dateTime) {
    if (dateTime == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
    return '${(diff.inDays / 365).floor()}y ago';
  }

  String _reviewCountText(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k';
    }
    return count.toString();
  }

  Widget _buildStars(int rating, {double size = 16}) {
    return Row(
      children: List.generate(5, (index) {
        return Icon(
          index < rating ? Icons.star : Icons.star_border,
          color: accentColor,
          size: size,
        );
      }),
    );
  }

  void _toggleReplyThread(int commentId) {
    setState(() {
      if (_expandedReplyThreads.contains(commentId)) {
        _expandedReplyThreads.remove(commentId);
      } else {
        _expandedReplyThreads.add(commentId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null || _product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Error")),
        body: Center(child: Text(_errorMessage ?? "Sản phẩm không tồn tại")),
      );
    }

    double finalPrice = _product!.salePrice ?? _product!.basePrice;
    int discountPercent = 0;
    if (_product!.salePrice != null &&
        _product!.salePrice! < _product!.basePrice) {
      discountPercent =
          ((1 - (_product!.salePrice! / _product!.basePrice)) * 100).round();
    }

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor.withOpacity(0.9),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: const Text(
          "ElectroMart",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageGallery(),
            _buildProductInfo(finalPrice, discountPercent),
          ],
        ),
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [_buildStickyBuyBar()],
      ),
    );
  }

  Widget _buildImageGallery() {
    return Container(
      height: 400,
      color: Colors.white,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          PageView.builder(
            itemCount: _product!.images.length,
            onPageChanged: (index) {
              setState(() => _currentImageIndex = index);
            },
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.all(32.0),
                child: Image.network(
                  _product!.images[index],
                  fit: BoxFit.contain,
                ),
              );
            },
          ),
          Positioned(
            bottom: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_product!.images.length, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 6,
                  width: _currentImageIndex == index ? 24 : 6,
                  decoration: BoxDecoration(
                    color: _currentImageIndex == index
                        ? primaryColor
                        : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductInfo(double finalPrice, int discountPercent) {
    final avgRating = _reviewSummary?.averageRating ?? _product!.averageRating;
    final totalReviews = _reviewSummary?.totalReviews?.toInt() ?? 0;

    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  "NEW ARRIVAL",
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(Icons.star, color: accentColor, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    avgRating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    totalReviews > 0
                        ? "(${_reviewCountText(totalReviews)} reviews)"
                        : "(${_product!.viewCount} views)",
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            _product!.variantName,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _product!.summary,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                _formatPrice(finalPrice),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 12),
              if (discountPercent > 0) ...[
                Text(
                  _formatPrice(_product!.basePrice),
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 16,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  "$discountPercent% OFF",
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 24),
          if (_product!.attributes.isNotEmpty) ...[
            const Text(
              "Key Features",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _product!.attributes.length > 4
                  ? 4
                  : _product!.attributes.length,
              itemBuilder: (context, index) {
                String key = _product!.attributes.keys.elementAt(index);
                String value = _product!.attributes.values.elementAt(index);

                IconData icon = Icons.memory;
                if (key.toLowerCase().contains("camera")) {
                  icon = Icons.photo_camera;
                }
                if (key.toLowerCase().contains("pin") ||
                    key.toLowerCase().contains("battery")) {
                  icon = Icons.battery_charging_full;
                }

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(icon, color: primaryColor, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              key,
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 10,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              value,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
          ],
          const Text(
            "Description",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            _product!.description,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 28),
          _buildReviewSection(),
          const SizedBox(height: 28),
          _buildCommentSection(),
        ],
      ),
    );
  }

  Widget _buildReviewSection() {
    if (_isReviewLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final average = _reviewSummary?.averageRating ?? 0.0;
    final total = _reviewSummary?.totalReviews?.toInt() ?? _reviews.length;
    final displayedReviews = _showAllReviews
        ? _reviews
        : _reviews.take(2).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                "Customer Reviews",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
              ),
            ),
            Icon(Icons.star, color: accentColor, size: 18),
            const SizedBox(width: 4),
            Text(
              average.toStringAsFixed(1),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 4),
            Text(
              "(${_reviewCountText(total)})",
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_reviews.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Text(
              "There are no reviews yet.",
              style: TextStyle(color: Colors.grey),
            ),
          )
        else ...[
          ...displayedReviews.map(_buildReviewCard),
          if (_reviews.length > 2)
            Center(
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _showAllReviews = !_showAllReviews;
                  });
                },
                child: Text(
                  _showAllReviews ? 'Show less reviews' : 'Show more reviews',
                  style: TextStyle(
                    color: primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildReviewCard(ReviewModel review) {
    final username = review.user?.username ?? 'User';
    final rating = review.ratingScore ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.blueGrey.shade100,
                child: Text(
                  username.isNotEmpty ? username[0].toUpperCase() : 'U',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      username,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    _buildStars(rating, size: 15),
                  ],
                ),
              ),
              Text(
                _timeAgo(review.createdAt),
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
          if ((review.comment ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              review.comment!,
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ],
          if ((review.imageUrl ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                review.imageUrl!,
                height: 88,
                width: 88,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 88,
                    width: 88,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.image_outlined, color: Colors.grey),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCommentSection() {
    final displayedComments = _showAllComments
        ? _comments
        : _comments.take(2).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Community Comments",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        const SizedBox(height: 16),
        if (_isCommentLoading)
          const Center(child: CircularProgressIndicator())
        else if (_comments.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Text(
              "There are no comments yet.",
              style: TextStyle(color: Colors.grey),
            ),
          )
        else ...[
          ...displayedComments.map((comment) => _buildCommentItem(comment)),
          if (_comments.length > 2)
            Center(
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _showAllComments = !_showAllComments;
                  });
                },
                child: Text(
                  _showAllComments
                      ? 'Show less comments'
                      : 'Show more comments',
                  style: TextStyle(
                    color: primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
        const SizedBox(height: 18),
        _buildCommentInputBox(),
      ],
    );
  }

  Widget _buildCommentItem(CommentModel comment, {double leftPadding = 0}) {
    final username = comment.user?.username ?? 'User';
    final replies = comment.replies;
    final bool canReply =
        comment.isAdminReply == true || comment.user?.id == _currentUserId;

    final bool showAllReplies = _expandedReplyThreads.contains(comment.id);
    final displayedReplies = showAllReplies
        ? replies
        : replies.take(2).toList();

    return Padding(
      padding: EdgeInsets.only(left: leftPadding, bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: comment.isAdminReply == true
                ? primaryColor.withOpacity(0.15)
                : Colors.blueGrey.shade100,
            child: Text(
              username.isNotEmpty ? username[0].toUpperCase() : 'U',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: comment.isAdminReply == true
                    ? primaryColor
                    : Colors.black87,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(
                        comment.isAdminReply == true ? 12 : 4,
                      ),
                      topRight: const Radius.circular(12),
                      bottomLeft: const Radius.circular(12),
                      bottomRight: const Radius.circular(12),
                    ),
                    border: Border.all(
                      color: comment.isAdminReply == true
                          ? primaryColor.withOpacity(0.25)
                          : Colors.grey.shade200,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    username,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (comment.isAdminReply == true) ...[
                                  const SizedBox(width: 4),
                                  Icon(
                                    Icons.verified,
                                    size: 14,
                                    color: primaryColor,
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _timeAgo(comment.createdAt),
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        comment.content ?? '',
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 14,
                          height: 1.5,
                        ),
                        softWrap: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                if (canReply)
                  TextButton.icon(
                    onPressed: () {
                      setState(() {
                        _replyingToCommentId = comment.id;
                        _replyingToUsername = username;
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 0,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: Icon(Icons.reply, size: 14, color: primaryColor),
                    label: Text(
                      "Reply",
                      style: TextStyle(
                        color: primaryColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                if (replies.isNotEmpty) ...[
                  ...displayedReplies.map(
                    (reply) => Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _buildCommentItem(reply, leftPadding: 18),
                    ),
                  ),
                  if (replies.length > 2)
                    Padding(
                      padding: const EdgeInsets.only(left: 18, top: 4),
                      child: TextButton(
                        onPressed: () => _toggleReplyThread(comment.id!),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 0,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          showAllReplies
                              ? 'Show less replies'
                              : 'Show more replies',
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentInputBox() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_replyingToCommentId != null)
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Replying to ${_replyingToUsername ?? 'comment'}',
                    style: TextStyle(
                      color: primaryColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _replyingToCommentId = null;
                      _replyingToUsername = null;
                    });
                  },
                  child: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
          ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.blueGrey.shade100,
                child: const Icon(
                  Icons.person,
                  size: 18,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _commentController,
                  minLines: 1,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: _replyingToCommentId != null
                        ? "Write a reply..."
                        : "Write a comment...",
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                decoration: BoxDecoration(
                  color: _isPostingComment ? Colors.grey : primaryColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  onPressed: _isPostingComment ? null : _submitComment,
                  icon: _isPostingComment
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStickyBuyBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Container(
            //   height: 54,
            //   width: 54,
            //   decoration: BoxDecoration(
            //     border: Border.all(color: Colors.grey.shade300, width: 2),
            //     borderRadius: BorderRadius.circular(14),
            //   ),
            //   // child: IconButton(
            //   //   icon: const Icon(Icons.favorite_border, color: Colors.grey),
            //   //   onPressed: () {},
            //   // ),
            // ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _showQuantitySheet(isBuyNow: false),
                icon: const Icon(Icons.shopping_cart_outlined, size: 20),
                label: const Text("Add to Cart"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 5,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _showQuantitySheet(isBuyNow: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 5,
                ),
                child: const Text(
                  "Buy Now",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
