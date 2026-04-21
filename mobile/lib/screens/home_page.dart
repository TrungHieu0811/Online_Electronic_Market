import 'package:electromart_flutter/models/comment_notification_model.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/screens/product_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/services/comment_notification_service.dart';
import 'package:electromart_flutter/screens/comment_thread_page.dart';
// 👉 NHỚ IMPORT FILE MODELS BẠN VỪA TẠO VÀO ĐÂY:
// import 'models.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  bool _isSearchLoading = false;
  List<ProductModel> _searchResults = [];
  final CommentNotificationService _commentNotificationService =
      CommentNotificationService();

  List<CommentNotificationModel> _commentNotifications = [];
  bool _isNotificationLoading = false;
  int get _unreadNotificationCount =>
      _commentNotifications.where((e) => !e.isRead).length;
  @override
  void initState() {
    super.initState();
    _loadCommentNotifications();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  final Color primaryColor = const Color(0xFF045fae);
  final Color secondaryColor = const Color(0xFFff8c00);
  final Color bgColor = const Color(0xFFf5f7f8);
  int _selectedIndex = 0;

  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:8080/api/public'));

  // Hàm gọi API lấy danh mục
  // Hàm gọi API lấy danh mục
  Future<List<CategoryModel>> _fetchCategories() async {
    final response = await _dio.get('/categories');

    // 👉 THÊM DÒNG NÀY ĐỂ XEM BACKEND THỰC SỰ TRẢ VỀ CÁI GÌ:
    debugPrint('DỮ LIỆU CATEGORY: ${response.data}');

    List data = response.data;
    return data.map((json) => CategoryModel.fromJson(json)).toList();
  }
  // Future<List<CategoryModel>> _fetchCategories() async {
  //   final response = await _dio.get('/categories');
  //   List data = response.data;
  //   return data.map((json) => CategoryModel.fromJson(json)).toList();
  // }

  // Hàm gọi API lấy sản phẩm nổi bật
  // Hàm gọi API lấy TOÀN BỘ sản phẩm thay vì chỉ featured
  Future<List<ProductModel>> _fetchAllProducts() async {
    // Gọi thẳng vào /products kèm size=50
    final response = await _dio.get('/products?size=50');

    // ĐIỂM KHÁC BIỆT: Phải lấy từ response.data['content'] vì đây là API phân trang
    List data = response.data['content'] ?? [];

    return data.map((json) => ProductModel.fromJson(json)).toList();
  }
  // Future<List<ProductModel>> _fetchFeaturedProducts() async {
  //   final response = await _dio.get('/products/featured');
  //   List data = response.data;
  //   return data.map((json) => ProductModel.fromJson(json)).toList();
  // }

  // 👉 SỬA: Đổi kiểu dữ liệu sang dynamic và tên sang categoryIds
  Future<void> _handleSearch({String? keyword, dynamic categoryIds}) async {
    setState(() {
      _isSearching = true;
      _isSearchLoading = true;
    });

    try {
      Map<String, dynamic> params = {};

      if (keyword != null && keyword.isNotEmpty) {
        params['keyword'] = keyword;
        _searchController.text = keyword;
      }

      // 👉 SỬA: Dùng tham số categoryIds mới
      if (categoryIds != null) {
        params['categoryIds'] = categoryIds;
      }

      final response = await _dio.get('/products', queryParameters: params);
      List data = response.data['content'] ?? [];

      setState(() {
        _searchResults = data
            .map((json) => ProductModel.fromJson(json))
            .toList();
        _isSearchLoading = false;
      });
    } catch (e) {
      setState(() {
        _isSearchLoading = false;
        _searchResults = [];
      });
    }
  }

  Future<void> _loadCommentNotifications() async {
    setState(() {
      _isNotificationLoading = true;
    });

    try {
      final notifications = await _commentNotificationService
          .getMyCommentNotifications();

      debugPrint('NOTI COUNT = ${notifications.length}');

      setState(() {
        _commentNotifications = notifications;
      });
    } catch (e) {
      debugPrint('LOAD NOTI ERROR = $e');
    } finally {
      if (mounted) {
        setState(() {
          _isNotificationLoading = false;
        });
      }
    }
  }

  Future<void> _showNotificationMenu() async {
    await _loadCommentNotifications();

    if (!mounted) return;

    final RenderBox button = context.findRenderObject() as RenderBox;
    final RenderBox overlay =
        Overlay.of(context).context.findRenderObject() as RenderBox;

    final result = await showMenu<dynamic>(
      context: context,
      position: RelativeRect.fromRect(
        Rect.fromPoints(
          button.localToGlobal(const Offset(260, 70), ancestor: overlay),
          button.localToGlobal(const Offset(360, 120), ancestor: overlay),
        ),
        Offset.zero & overlay.size,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      items: [
        PopupMenuItem(
          enabled: false,
          padding: EdgeInsets.zero,
          child: SizedBox(
            width: 320,
            child: StatefulBuilder(
              builder: (context, setMenuState) {
                if (_isNotificationLoading) {
                  return const Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Notice of comments',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          TextButton(
                            onPressed: _commentNotifications.isEmpty
                                ? null
                                : () async {
                                    try {
                                      await _commentNotificationService
                                          .markAllCommentNotificationsAsRead();

                                      if (!mounted) return;

                                      setState(() {
                                        _commentNotifications =
                                            _commentNotifications
                                                .map(
                                                  (e) =>
                                                      e.copyWith(isRead: true),
                                                )
                                                .toList();
                                      });

                                      Navigator.pop(context, 'reload');
                                    } catch (e) {
                                      debugPrint('Lỗi mark all read: $e');
                                    }
                                  },
                            child: const Text('Mark all read'),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    if (_commentNotifications.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(18),
                        child: Text(
                          'Chưa có thông báo nào.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    else
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 360),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: _commentNotifications.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final notification = _commentNotifications[index];

                            return InkWell(
                              onTap: () async {
                                try {
                                  if (!notification.isRead) {
                                    await _commentNotificationService
                                        .markCommentNotificationAsRead(
                                          notification.id,
                                        );

                                    setState(() {
                                      _commentNotifications[index] =
                                          _commentNotifications[index].copyWith(
                                            isRead: true,
                                          );
                                    });
                                  }

                                  if (!mounted) return;
                                  Navigator.pop(context, notification);
                                } catch (e) {
                                  debugPrint('Lỗi mark read: $e');
                                }
                              },
                              child: Container(
                                color: notification.isRead
                                    ? Colors.white
                                    : const Color(0xFFF2F8FF),
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.comment_outlined,
                                      color: notification.isRead
                                          ? Colors.grey
                                          : primaryColor,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            notification.title ??
                                                'Admin đã phản hồi bình luận',
                                            style: TextStyle(
                                              fontWeight: notification.isRead
                                                  ? FontWeight.w500
                                                  : FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            notification.message ??
                                                'Nhấn để xem chi tiết bình luận.',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (!notification.isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        margin: const EdgeInsets.only(top: 6),
                                        decoration: BoxDecoration(
                                          color: secondaryColor,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );

    if (result == 'reload') {
      await _loadCommentNotifications();
      return;
    }

    if (result is CommentNotificationModel && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CommentThreadPage(
            productId: result.productId,
            focusCommentId: result.commentId,
          ),
        ),
      ).then((_) => _loadCommentNotifications());
    }
  }

  // Mẹo UX: Tự động map icon dựa theo tên category
  IconData _getIconForCategory(String slug) {
    slug = slug.toLowerCase();
    if (slug.contains('phone')) return Icons.smartphone;
    if (slug.contains('laptop') || slug.contains('mac'))
      return Icons.laptop_mac;
    if (slug.contains('tv') || slug.contains('screen')) return Icons.tv;
    if (slug.contains('appliance') || slug.contains('kitchen'))
      return Icons.kitchen;
    return Icons.category; // Icon mặc định
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              _buildSearchBar(),

              // 👉 THUẬT TOÁN ĐỔI GIAO DIỆN Ở ĐÂY
              if (_isSearching)
                _buildSearchResults() // Nếu đang search thì hiện mảng kết quả
              else ...[
                // Nếu không search thì hiện bình thường
                _buildCategories(),
                // _buildHeroBanner(),
                _buildFeaturedProducts(),
                // _buildBestSellers(),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      // bottomNavigationBar: _buildBottomNavbar(),
    );
  }

  Widget _buildSearchResults() {
    if (_isSearchLoading) {
      return const Padding(
        padding: EdgeInsets.only(top: 50.0),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_searchResults.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 50.0),
        child: Center(
          child: Text(
            "Không tìm thấy sản phẩm nào.",
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Kết quả tìm kiếm (${_searchResults.length})",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.65,
            ),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final product = _searchResults[index];

              // Tái sử dụng logic tính toán giá và discount như cũ
              String? discountBadge;
              if (product.salePrice != null &&
                  product.salePrice! < product.basePrice) {
                int discountPercent =
                    ((1 - (product.salePrice! / product.basePrice)) * 100)
                        .round();
                discountBadge = "-$discountPercent%";
              }
              String displayPrice =
                  "\$${(product.salePrice ?? product.basePrice).toStringAsFixed(0)}";

              return GestureDetector(
                onTap: () {
                  // 👉 ĐÃ THÊM: Điều hướng sang trang ProductDetailPage và truyền slug
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          ProductDetailPage(slug: product.slug),
                    ),
                  );
                },
                child: _buildProductCard(
                  brand: product.brandName,
                  name: product.variantName,
                  price: displayPrice,
                  rating: product.averageRating.toStringAsFixed(1),
                  reviews: "(${3})",
                  imageUrl: product.imageUrl,
                  discount: discountBadge,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 1. HEADER (Giữ nguyên)
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.bolt, color: primaryColor, size: 32),
              const SizedBox(width: 4),
              Text(
                "ElectroMart",
                style: TextStyle(
                  color: primaryColor,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.notifications_none,
                      color: Colors.black87,
                    ),
                    onPressed: _showNotificationMenu,
                  ),
                  if (_unreadNotificationCount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: secondaryColor,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          _unreadNotificationCount > 9
                              ? '9+'
                              : '$_unreadNotificationCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              IconButton(
                icon: const Icon(
                  Icons.shopping_cart_outlined,
                  color: Colors.black87,
                ),
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. SEARCH BAR (Giữ nguyên)
  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController, // 👉 Gắn Controller vào
              textInputAction: TextInputAction.search,
              onSubmitted: (value) {
                _handleSearch(keyword: value);
              },
              onChanged: (value) {
                // Nếu người dùng xóa sạch chữ, tự động quay về trang chủ
                if (value.isEmpty && _isSearching) {
                  setState(() {
                    _isSearching = false;
                    _searchResults.clear();
                  });
                }
              },
              decoration: InputDecoration(
                hintText: "Search for electronics...",
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                // 👉 Thêm nút X để xóa nhanh chữ
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _isSearching = false;
                            _searchResults.clear();
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
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
              color: primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            // child: IconButton(
            //   icon: Icon(Icons.tune, color: primaryColor),
            //   onPressed: () {},
            // ),
          ),
        ],
      ),
    );
  }

  // 3. CATEGORIES TỪ DATABASE
  Widget _buildCategories() {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 24.0),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.only(right: 16.0, bottom: 12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Categories",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                // 👉 Đã xóa "See All" theo ý Quang nhé
              ],
            ),
          ),
          SizedBox(
            height: 90,
            child: FutureBuilder<List<CategoryModel>>(
              future: _fetchCategories(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final allCategories = snapshot.data ?? [];

                // 1. 👉 LỌC DANH MỤC GỐC: Những category có parentId == null
                final rootCategories = allCategories
                    .where((cat) => cat.parentId == null)
                    .toList();

                return ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: rootCategories
                      .length, // Dùng danh sách đã lọc (Chỉ hiện Cha)
                  itemBuilder: (context, index) {
                    final cat = rootCategories[index];
                    return Padding(
                      padding: const EdgeInsets.only(right: 20.0),
                      child: GestureDetector(
                        onTap: () {
                          _searchController.text = cat.name;

                          // 2. 👉 GỘP ID: Lấy ID của Cha và ID của tất cả đám Con
                          List<int> idsToSearch = [cat.id];
                          final children = allCategories.where(
                            (c) => c.parentId == cat.id,
                          );
                          idsToSearch.addAll(children.map((c) => c.id));

                          // Gọi API với chuỗi gộp ID (ví dụ: "1,2,3")
                          _handleSearch(categoryIds: idsToSearch.join(','));
                        },
                        child: Column(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: primaryColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Icon(
                                _getIconForCategory(cat.slug),
                                color: primaryColor,
                                size: 30,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              cat.name,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // // 4. HERO BANNER (ĐÃ FIX LỖI OVERFLOW BẰNG CÁCH NỚI CHIỀU CAO)
  // Widget _buildHeroBanner() {
  //   return Padding(
  //     padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
  //     child: Container(
  //       width: double.infinity,
  //       height: 220, // 👉 Tăng chiều cao lên 220 để không bị lòi nút bấm
  //       decoration: BoxDecoration(
  //         color: primaryColor,
  //         borderRadius: BorderRadius.circular(16),
  //       ),
  //       child: Stack(
  //         children: [
  //           Container(
  //             decoration: BoxDecoration(
  //               borderRadius: BorderRadius.circular(16),
  //               gradient: LinearGradient(
  //                 colors: [Colors.black.withOpacity(0.6), Colors.transparent],
  //                 begin: Alignment.centerLeft,
  //                 end: Alignment.centerRight,
  //               ),
  //             ),
  //           ),
  //           Padding(
  //             padding: const EdgeInsets.all(20.0),
  //             child: Column(
  //               crossAxisAlignment: CrossAxisAlignment.start,
  //               mainAxisAlignment: MainAxisAlignment.center,
  //               children: [
  //                 // Container(
  //                 //   padding: const EdgeInsets.symmetric(
  //                 //     horizontal: 8,
  //                 //     vertical: 4,
  //                 //   ),
  //                 //   decoration: BoxDecoration(
  //                 //     color: secondaryColor,
  //                 //     borderRadius: BorderRadius.circular(4),
  //                 //   ),
  //                 //   child: const Text(
  //                 //     "NEW ARRIVAL",
  //                 //     style: TextStyle(
  //                 //       color: Colors.white,
  //                 //       fontSize: 10,
  //                 //       fontWeight: FontWeight.bold,
  //                 //     ),
  //                 //   ),
  //                 // ),
  //                 // const SizedBox(height: 8),
  //                 // const Text(
  //                 //   "iPhone 15 Pro",
  //                 //   style: TextStyle(
  //                 //     color: Colors.white,
  //                 //     fontSize: 24,
  //                 //     fontWeight: FontWeight.w900,
  //                 //   ),
  //                 // ),
  //                 // const SizedBox(height: 4),
  //                 // const Text(
  //                 //   "Upgrade to the latest titanium\ndesign starting at \$999",
  //                 //   style: TextStyle(color: Colors.white70, fontSize: 12),
  //                 // ),
  //                 const SizedBox(height: 16), // Tăng khoảng cách chút cho đẹp
  //                 ElevatedButton(
  //                   onPressed: () {},
  //                   style: ElevatedButton.styleFrom(
  //                     backgroundColor: Colors.white,
  //                     foregroundColor: primaryColor,
  //                     shape: RoundedRectangleBorder(
  //                       borderRadius: BorderRadius.circular(8),
  //                     ),
  //                     padding: const EdgeInsets.symmetric(
  //                       horizontal: 20,
  //                       vertical: 10,
  //                     ),
  //                   ),
  //                   child: const Text(
  //                     "Shop Now",
  //                     style: TextStyle(
  //                       fontWeight: FontWeight.bold,
  //                       fontSize: 12,
  //                     ),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ),
  //         ],
  //       ),
  //     ),
  //   );
  // }

  // 5. FEATURED PRODUCTS TỪ DATABASE
  Widget _buildFeaturedProducts() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Products",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          const SizedBox(height: 16),
          FutureBuilder<List<ProductModel>>(
            future: _fetchAllProducts(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(child: Text("Error: ${snapshot.error}"));
              } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return const Center(child: Text("No featured products."));
              }

              final products = snapshot.data!;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.65, // Chỉnh lại tỷ lệ cho thẻ card
                ),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  final product = products[index];
                  // Tính phần trăm giảm giá nếu có
                  String? discountBadge;
                  if (product.salePrice != null &&
                      product.salePrice! < product.basePrice) {
                    int discountPercent =
                        ((1 - (product.salePrice! / product.basePrice)) * 100)
                            .round();
                    discountBadge = "-$discountPercent%";
                  }

                  // Lấy giá hiển thị (ưu tiên giá sale)
                  String displayPrice =
                      "\$${(product.salePrice ?? product.basePrice).toStringAsFixed(0)}";

                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              ProductDetailPage(slug: product.slug),
                        ),
                      );
                    },
                    child: _buildProductCard(
                      brand: product.brandName,
                      name: product.variantName,
                      price: displayPrice,
                      rating: product.averageRating.toStringAsFixed(1),
                      // reviews: "(${product.viewCount})",
                      reviews: "(${3})",
                      imageUrl: product.imageUrl,
                      discount: discountBadge,
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard({
    required String brand,
    required String name,
    required String price,
    required String rating,
    required String reviews,
    required String imageUrl,
    String? discount,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    color: bgColor,
                    width: double.infinity,
                    height: double.infinity,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      // 👉 Bộ giáp chống sập: Nếu ảnh chết, lập tức đổi sang Icon
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(
                          child: Icon(
                            Icons.image_not_supported,
                            size: 40,
                            color: Colors.grey,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: CircleAvatar(
                    backgroundColor: Colors.white.withOpacity(0.8),
                    radius: 14,
                    child: const Icon(
                      Icons.favorite_border,
                      size: 16,
                      color: Colors.grey,
                    ),
                  ),
                ),
                if (discount != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: secondaryColor,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        discount,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            brand.toUpperCase(),
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.star, color: Colors.amber, size: 14),
              const SizedBox(width: 4),
              Text(
                rating,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                reviews,
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                price,
                style: TextStyle(
                  color: primaryColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: primaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.add, color: Colors.white, size: 18),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 7. BOTTOM NAVBAR (Giữ nguyên)
  // Widget _buildBottomNavbar() {
  //   return Container(
  //     decoration: BoxDecoration(
  //       border: Border(top: BorderSide(color: Colors.grey.shade300)),
  //     ),
  //     child: BottomNavigationBar(
  //       currentIndex: _selectedIndex,
  //       onTap: (index) => setState(() => _selectedIndex = index),
  //       type: BottomNavigationBarType.fixed,
  //       backgroundColor: Colors.white,
  //       selectedItemColor: primaryColor,
  //       unselectedItemColor: Colors.grey,
  //       selectedFontSize: 10,
  //       unselectedFontSize: 10,
  //       elevation: 0,
  //       items: [
  //         const BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
  //         const BottomNavigationBarItem(
  //           icon: Icon(Icons.grid_view),
  //           label: "Categories",
  //         ),
  //         BottomNavigationBarItem(
  //           icon: Stack(
  //             clipBehavior: Clip.none,
  //             children: [
  //               const Icon(Icons.shopping_bag_outlined),
  //               Positioned(
  //                 top: -4,
  //                 right: -4,
  //                 child: Container(
  //                   padding: const EdgeInsets.all(4),
  //                   decoration: BoxDecoration(
  //                     color: secondaryColor,
  //                     shape: BoxShape.circle,
  //                   ),
  //                   child: const Text(
  //                     "3",
  //                     style: TextStyle(
  //                       color: Colors.white,
  //                       fontSize: 8,
  //                       fontWeight: FontWeight.bold,
  //                     ),
  //                   ),
  //                 ),
  //               ),
  //             ],
  //           ),
  //           label: "Cart",
  //         ),
  //         const BottomNavigationBarItem(
  //           icon: Icon(Icons.favorite_border),
  //           label: "Wishlist",
  //         ),
  //         const BottomNavigationBarItem(
  //           icon: Icon(Icons.person_outline),
  //           label: "Profile",
  //         ),
  //       ],
  //     ),
  //   );
  // }
}
