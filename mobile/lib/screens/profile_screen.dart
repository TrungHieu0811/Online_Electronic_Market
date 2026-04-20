import 'package:electromart_flutter/screens/change_password_screen.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'edit_profile_screen.dart';
import 'login_screen.dart';
import 'order_history_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  String _errorMessage = '';

  // Định nghĩa màu sắc theo theme của bạn (từ file HTML)
  final Color primaryColor = const Color(0xFF045fae);
  final Color secondaryColor = const Color(0xFFff6b00);
  final Color bgColor = const Color(0xFFF5F7F8);

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    try {
      final data = await _apiService.getUserProfile();
      setState(() {
        _userData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    await const FlutterSecureStorage().delete(key: 'jwt_token');
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: bgColor,
        body: Center(child: CircularProgressIndicator(color: primaryColor)),
      );
    }

    if (_errorMessage.isNotEmpty) {
      return Scaffold(
        backgroundColor: bgColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red, fontSize: 16),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _logout,
                style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                child: const Text(
                  'Return to login',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text(
          'Profile',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 1.0),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: 40,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. THẺ THÔNG TIN CÁ NHÂN (USER INFO CARD)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Avatar & Badge Camera
                  Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: primaryColor.withOpacity(0.1),
                            width: 4,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.blue.shade50,
                          // 👉 SỬA ĐOẠN NÀY ĐỂ NỐI THÊM BASE URL
                          backgroundImage:
                              (_userData?['avatarUrl'] != null &&
                                  _userData!['avatarUrl'].toString().isNotEmpty)
                              ? NetworkImage(
                                  // Kiểm tra xem link có chữ http chưa, nếu chưa thì ghép thêm domain của Backend vào
                                  _userData!['avatarUrl'].toString().startsWith(
                                        'http',
                                      )
                                      ? _userData!['avatarUrl']
                                      : '${ApiService.getBaseUrl.replaceAll('/api', '')}/uploads${_userData!['avatarUrl']}',
                                )
                              : null,
                          child:
                              (_userData?['avatarUrl'] == null ||
                                  _userData!['avatarUrl'].isEmpty)
                              ? Icon(
                                  Icons.person,
                                  size: 50,
                                  color: primaryColor,
                                )
                              : null,
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: secondaryColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Tên & Email
                  Text(
                    _userData?['fullName'] ?? 'Have not updated',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _userData?['email'] ?? 'Have not updated',
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),

                  const SizedBox(height: 12),

                  // Platinum Member Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified, color: primaryColor, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          'Platinum Member', // Bạn có thể map theo rewardPoints sau
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Nút Edit Profile
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                EditProfileScreen(currentData: _userData!),
                          ),
                        );
                        if (result == true) _fetchProfileData();
                      },
                      icon: const Icon(
                        Icons.edit,
                        size: 18,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Edit Profile',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // 2. KHU VỰC: MY ACCOUNT
            _buildSectionTitle('My Account'),
            const SizedBox(height: 8),
            _buildActionTile(
              icon: Icons.shopping_bag_outlined,
              iconColor: primaryColor,
              iconBgColor: primaryColor.withOpacity(0.1),
              title: 'Order History',
              subtitle: 'View your past tech purchases',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const OrderHistoryScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.password_outlined,
              iconColor: primaryColor,
              iconBgColor: primaryColor.withOpacity(0.1),
              title: 'Change Password',
              subtitle: 'Update your security credentials',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ChangePasswordScreen(),
                  ),
                );
              },
            ),

            // _buildActionTile(
            //   icon: Icons.location_on_outlined,
            //   iconColor: primaryColor,
            //   iconBgColor: primaryColor.withOpacity(0.1),
            //   title: 'Saved Addresses',
            //   subtitle: 'Manage delivery locations',
            //   onTap: () {}, // Bổ sung tính năng sau
            // ),
            // _buildActionTile(
            //   icon: Icons.payment_outlined,
            //   iconColor: primaryColor,
            //   iconBgColor: primaryColor.withOpacity(0.1),
            //   title: 'Payment Methods',
            //   subtitle: 'Cards and digital wallets',
            //   onTap: () {}, // Bổ sung tính năng sau
            // ),
            // _buildActionTile(
            //   icon: Icons.favorite_border,
            //   iconColor: primaryColor,
            //   iconBgColor: primaryColor.withOpacity(0.1),
            //   title: 'Wishlist',
            //   subtitle: "Items you've saved for later",
            //   onTap: () {}, // Bổ sung tính năng sau
            // ),
            const SizedBox(height: 24),

            // 3. KHU VỰC: SUPPORT & SAFETY
            _buildSectionTitle('Support & Safety'),
            const SizedBox(height: 8),
            // _buildActionTile(
            //   icon: Icons.help_outline,
            //   iconColor: Colors.grey.shade700,
            //   iconBgColor: Colors.grey.shade200,
            //   title: 'Customer Support',
            //   onTap: () {}, // Bổ sung tính năng sau
            // ),
            _buildActionTile(
              icon: Icons.logout,
              iconColor: Colors.red,
              iconBgColor: Colors.red.withOpacity(0.1),
              title: 'Logout',
              isDestructive: true,
              onTap: _logout,
            ),
            const SizedBox(height: 20), // Dành chỗ cho Bottom Nav
          ],
        ),
      ),

      // BOTTOM NAVIGATION BAR (Giống giao diện Web)
      // Lưu ý: Nếu App của bạn đã có màn hình MainScreen quản lý BottomNav thì bạn có thể xóa phần này.
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,

              // children: [
              //   _buildBottomNavItem(Icons.home_outlined, 'Home', false),
              //   _buildBottomNavItem(
              //     Icons.category_outlined,
              //     'Categories',
              //     false,
              //   ),
              //   _buildBottomNavItem(
              //     Icons.shopping_cart_outlined,
              //     'Cart',
              //     false,
              //   ),
              //   _buildBottomNavItem(Icons.favorite_outline, 'Wishlist', false),
              //   _buildBottomNavItem(Icons.person, 'Profile', true),
              // ],
            ),
          ),
        ),
      ),
    );
  }

  // Widget tạo tiêu đề khu vực (MY ACCOUNT, SUPPORT & SAFETY)
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0, bottom: 4.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  // Widget tạo các hàng menu giống thiết kế HTML
  Widget _buildActionTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDestructive ? Colors.red : Colors.black87,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (!isDestructive)
                  Icon(Icons.chevron_right, color: Colors.grey.shade400),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Hàm phụ trợ tạo Bottom Navigation Item
  Widget _buildBottomNavItem(IconData icon, String label, bool isActive) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          color: isActive ? primaryColor : Colors.grey.shade400,
          size: 26,
        ),
        const SizedBox(height: 4),
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isActive ? primaryColor : Colors.grey.shade400,
          ),
        ),
      ],
    );
  }
}
