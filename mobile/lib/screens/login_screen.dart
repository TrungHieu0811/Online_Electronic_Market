import 'dart:convert';

import 'package:electromart_flutter/screens/forgot_password_screen.dart';
import 'package:electromart_flutter/screens/home_page.dart';
import 'package:electromart_flutter/screens/main_page.dart';
import 'package:electromart_flutter/screens/profile_screen.dart';
import 'package:electromart_flutter/services/cart_service.dart';
import 'package:flutter/material.dart';
import '../models/login_request.dart';
import '../services/api_service.dart';
import 'register_screen.dart'; // Dùng để bấm nút chuyển sang trang Đăng ký
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _rememberMe = false;
  final ApiService _apiService = ApiService();

  Future<void> _handleLogin() async {
    FocusScope.of(context).unfocus();

    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      _showSnackBar('Please enter username and password', Colors.orange);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final request = LoginRequest(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );

      final success = await _apiService.loginUser(request);

      if (mounted) {
        if (success) {
          _showSnackBar('Login succeeded!', Colors.green);
          // --- THÊM 3 DÒNG NÀY ĐỂ KIỂM TRA KÉT SẮT ---
          String? savedToken = await const FlutterSecureStorage().read(
            key: 'jwt_token',
          );
          print("=== [KÉT SẮT] TOKEN CỦA BẠN LÀ: $savedToken ===");
          // -------------------------------------------
          // ✨ BƯỚC THÊM MỚI: LOGIC MERGE CART (Không đổi code cũ)
          if (savedToken != null) {
            try {
              final prefs = await SharedPreferences.getInstance();
              // Lấy giỏ hàng tạm của Guest từ SharedPreferences
              String? guestCartJson = prefs.getString('guest_cart');

              if (guestCartJson != null && guestCartJson.isNotEmpty) {
                List<dynamic> guestList = jsonDecode(guestCartJson);
                List<Map<String, dynamic>> guestItems =
                    List<Map<String, dynamic>>.from(guestList);

                // Gọi API merge đã viết ở CartService
                await CartService().mergeGuestCart(savedToken, guestItems);

                // Xóa giỏ hàng tạm sau khi đã đẩy lên Server thành công
                await prefs.remove('guest_cart');
                print("=== [MERGE] Đồng bộ giỏ hàng thành công ===");
              }
            } catch (mergeError) {
              // Chỉ in ra log nếu merge lỗi, không làm gián đoạn việc đăng nhập
              print("=== [MERGE] Lỗi đồng bộ: $mergeError ===");
            }
          }
          // 👉 ĐỔI THÀNH MainPage CỦA BẠN NHÉ
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const MainPage()),
            (Route<dynamic> route) => false,
          );
        } else {
          _showSnackBar('Login failed', Colors.orange);
        }
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar(e.toString().replaceAll('Exception: ', ''), Colors.red);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              padding: const EdgeInsets.all(32.0),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  Container(
                    height: 60,
                    width: 60,
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.flash_on,
                      color: Colors.blue,
                      size: 30,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'ElectroMart',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 32),

                  const Text(
                    'Welcome Back',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Please enter your details to sign in',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  _buildLabel('Username'),
                  _buildTextField(
                    _usernameController,
                    'name',
                    Icons.person_outline,
                  ),
                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildLabel('Password'),
                      TextButton(
                        onPressed: () {
                          // 👉 CHỈ CHUYỂN SANG TRANG NHẬP EMAIL THÔI
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ForgotPasswordScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Forgot Password?',
                          style: TextStyle(color: Colors.blue, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  _buildTextField(
                    _passwordController,
                    '********',
                    Icons.lock_outline,
                    isPassword: true,
                  ),
                  const SizedBox(height: 16),

                  // Remember me
                  // Row(
                  //   children: [
                  //     SizedBox(
                  //       height: 24,
                  //       width: 24,
                  //       child: Checkbox(
                  //         value: _rememberMe,
                  //         onChanged: (val) =>
                  //             setState(() => _rememberMe = val!),
                  //         activeColor: const Color(0xFF4F46E5),
                  //         shape: RoundedRectangleBorder(
                  //           borderRadius: BorderRadius.circular(4),
                  //         ),
                  //       ),
                  //     ),
                  //     const SizedBox(width: 8),
                  //     const Text(
                  //       'Remember me for 30 days',
                  //       style: TextStyle(color: Colors.grey, fontSize: 13),
                  //     ),
                  //   ],
                  // ),
                  const SizedBox(height: 24),

                  // Nút Login màu xanh tím
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Login to Account →',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),

                  // const SizedBox(height: 24),
                  // const Center(
                  //   child: Text(
                  //     'OR CONTINUE WITH',
                  //     style: TextStyle(color: Colors.grey, fontSize: 12),
                  //   ),
                  // ),
                  // const SizedBox(height: 16),
                  const SizedBox(height: 24),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Don't have an account? ",
                        style: TextStyle(color: Colors.grey),
                      ),
                      TextButton(
                        onPressed: () {
                          // Chuyển sang màn hình Đăng ký
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const RegisterScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Register',
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // 👉 NÚT CONTINUE WITH INCOGNITO THÊM MỚI Ở ĐÂY
                  Center(
                    child: TextButton(
                      onPressed: () {
                        // Dùng pushReplacement để xóa trang Login khỏi lịch sử điều hướng
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            // ⚠️ NHỚ THAY 'MainScreen()' BẰNG TÊN TRANG CHÍNH CỦA BẠN NHÉ
                            builder: (_) => const MainPage(),
                          ),
                        );
                      },
                      child: const Text(
                        'Continue with incognito',
                        style: TextStyle(
                          color: Colors
                              .grey, // Cho màu xám để nhìn phụ hơn nút chính
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration
                              .underline, // Gạch chân nhìn cho giống link web
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: Color(0xFF334155),
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint,
    IconData icon, {
    bool isPassword = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
        prefixIcon: Icon(icon, size: 20, color: Colors.grey),
        suffixIcon: isPassword
            ? const Icon(Icons.visibility_off, size: 20, color: Colors.grey)
            : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(
            color: const Color(0xFF4F46E5),
            width: 2,
          ),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }

  Widget _buildSocialButton(String text, IconData icon) {
    return OutlinedButton.icon(
      onPressed: () {},
      icon: Icon(icon, color: Colors.black),
      label: Text(text, style: const TextStyle(color: Colors.black)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        side: BorderSide(color: Colors.grey.shade300),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
