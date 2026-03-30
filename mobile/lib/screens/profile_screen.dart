import 'package:electromart_flutter/screens/change_password_screen.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'edit_profile_screen.dart'; // Import trang Edit
import 'login_screen.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchProfileData(); // Vừa vào màn hình là gọi API lấy dữ liệu ngay
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
    // Xóa token khỏi két sắt
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
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage.isNotEmpty) {
      return Scaffold(
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
                child: const Text('Return to login'),
              ),
            ],
          ),
        ),
      );
    }

    // GIAO DIỆN KHI ĐÃ LẤY ĐƯỢC DỮ LIỆU
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          'ElectroMart Profile',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // THẺ THÔNG TIN CÁ NHÂN (Đã tích hợp nút Edit)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
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
                  // Phần trên: Avatar và thông tin
                  Row(
                    children: [
                      // ... bên trong children của Row ...
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.blue.shade50,

                        // 👉 SỬA ĐOẠN NÀY ĐỂ HIỂN THỊ ẢNH

                        // 1. Dùng backgroundImage để load ảnh từ Url
                        backgroundImage:
                            (_userData?['avatarUrl'] != null &&
                                _userData!['avatarUrl'].isNotEmpty)
                            ? NetworkImage(_userData!['avatarUrl'])
                            : null, // Nếu không có link ảnh thì để null
                        // 2. Cấu hình child (Icon mặc định) đè lên ảnh
                        // Nếu đã có ảnh (backgroundImage != null) thì child phải là null để không che mất ảnh
                        child:
                            (_userData?['avatarUrl'] == null ||
                                _userData!['avatarUrl'].isEmpty)
                            ? const Icon(
                                Icons.person,
                                size: 40,
                                color: Colors.blue,
                              )
                            : null, // Đã có ảnh thì không hiện Icon nữa
                      ),
                      const SizedBox(width: 24),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _userData?['fullName'] ?? 'Have not up',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.email_outlined,
                                  size: 16,
                                  color: Colors.grey,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _userData?['email'] ?? 'Have not updated',
                                    style: const TextStyle(color: Colors.grey),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(
                                  Icons.phone_outlined,
                                  size: 16,
                                  color: Colors.grey,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _userData?['phone'] ?? 'Have not updated',
                                  style: const TextStyle(color: Colors.grey),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),
                  const Divider(
                    color: Color(0xFFF1F5F9),
                    thickness: 1.5,
                  ), // Đường kẻ mờ
                  const SizedBox(height: 4),

                  // Phần dưới: Nút bấm Edit Profile Full Width
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      onPressed: () async {
                        // Chuyển sang trang Edit và chờ kết quả trả về
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                EditProfileScreen(currentData: _userData!),
                          ),
                        );

                        // Tải lại trang Profile nếu cập nhật thành công
                        if (result == true) {
                          _fetchProfileData();
                        }
                      },
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text(
                        'Edit Profile Information',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blue,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 👉 THÊM NÚT ĐỔI MẬT KHẨU
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ChangePasswordScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.password_outlined, size: 18),
                      label: const Text(
                        'Change Password',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor:
                            Colors.orange, // Màu cam cho nó phân biệt
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // CÁC THẺ THỐNG KÊ
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Reward Points',
                    '${_userData?['rewardPoints'] ?? 0}',
                    Icons.star_rounded,
                    Colors.orange,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard(
                    'Total Orders',
                    '0',
                    Icons.shopping_bag_outlined,
                    Colors.blue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }
}
