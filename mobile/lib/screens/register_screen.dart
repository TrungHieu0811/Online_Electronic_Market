import 'package:electromart_flutter/screens/login_screen.dart';
import 'package:electromart_flutter/screens/otp_screen.dart';
import 'package:flutter/material.dart';
import '../models/register_request.dart';
import '../services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Đã thêm _usernameController riêng biệt
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  final ApiService _apiService = ApiService();

  Future<void> _handleRegister() async {
    FocusScope.of(context).unfocus();

    // 1. Kiểm tra rỗng
    if (_fullNameController.text.isEmpty ||
        _usernameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _phoneController.text.isEmpty ||
        _passwordController.text.isEmpty) {
      _showSnackBar('Please enter all required fields!', Colors.orange);
      return;
    }

    // 2. Kiểm tra mật khẩu khớp nhau
    if (_passwordController.text != _confirmPasswordController.text) {
      _showSnackBar(
        'Password and confirm password are not the same!',
        Colors.red,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Tự động xóa các khoảng trắng trong số điện thoại (VD: "0900 123 456" -> "0900123456")
      // Điều này giúp Spring Boot không bị lỗi Regex
      String cleanPhone = _phoneController.text.replaceAll(RegExp(r'\s+'), '');

      final request = RegisterRequest(
        username: _usernameController.text
            .trim(), // Lấy từ ô nhập liệu chuẩn xác
        email: _emailController.text.trim(),
        phone: cleanPhone,
        password: _passwordController.text,
        confirmPassword: _confirmPasswordController.text,
        fullName: _fullNameController.text.trim(),
      );

      final message = await _apiService.registerUser(request);

      // if (mounted) {
      //   _showSnackBar(message, Colors.green);
      //   // TODO: Điều hướng sang trang Login sau khi đăng ký thành công
      // }
      if (mounted) {
        _showSnackBar(
          'Register successfully, please check your email for OTP to activate your account.',
          Colors.green,
        );

        // SỬA CHỖ NÀY: Đá người dùng sang trang OTP kèm theo email họ vừa nhập
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => OtpScreen(email: _emailController.text.trim()),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        // Cắt bỏ chữ "Exception: " mặc định của Dart cho thông báo đẹp hơn
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
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA), // Nền xám nhạt như thiết kế
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 500),
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
                  const Text(
                    'JOIN OUR COMMUNITY',
                    style: TextStyle(
                      color: Colors.blue,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Register',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Join ElectroMart today for exclusive deals and faster checkout.',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                  const SizedBox(height: 32),

                  _buildLabel('Full Name'),
                  _buildTextField(
                    _fullNameController,
                    'John Doe',
                    Icons.person_outline,
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Username'), // Đã thêm field Username
                  _buildTextField(
                    _usernameController,
                    'johndoe123',
                    Icons.alternate_email,
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Email Address'),
                  _buildTextField(
                    _emailController,
                    'john@example.com',
                    Icons.email_outlined,
                    isEmail: true,
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Phone Number'),
                  _buildTextField(
                    _phoneController,
                    '0900 123 456',
                    Icons.phone_outlined,
                    isPhone: true,
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Password'),
                            _buildTextField(
                              _passwordController,
                              '********',
                              Icons.lock_outline,
                              isPassword: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Confirm'),
                            _buildTextField(
                              _confirmPasswordController,
                              '********',
                              Icons.check_circle_outline,
                              isPassword: true,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleRegister,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(
                          0xFFD97736,
                        ), // Màu cam ElectroMart
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
                              'Register Account →',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  const Center(
                    child: Text(
                      'OR CONTINUE WITH',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildSocialButton('Google', Icons.g_mobiledata),
                      const SizedBox(width: 16),
                      _buildSocialButton('Apple', Icons.apple),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Already have an account? ',
                        style: TextStyle(color: Colors.grey),
                      ),
                      TextButton(
                        onPressed: () {
                          // Chuyển sang màn hình Đăng ký
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const LoginScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Login',
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
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
    bool isEmail = false,
    bool isPhone = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      keyboardType: isEmail
          ? TextInputType.emailAddress
          : (isPhone ? TextInputType.phone : TextInputType.text),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
        prefixIcon: Icon(icon, size: 20, color: Colors.grey),
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
          borderSide: const BorderSide(color: Colors.blue, width: 2),
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
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        side: BorderSide(color: Colors.grey.shade300),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
