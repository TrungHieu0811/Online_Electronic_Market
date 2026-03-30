import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  final ApiService _apiService = ApiService();

  Future<void> _handleChangePassword() async {
    FocusScope.of(context).unfocus();

    if (_oldPasswordController.text.isEmpty ||
        _newPasswordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      _showSnackBar('Please enter all required fields!', Colors.orange);
      return;
    }

    if (_newPasswordController.text == _oldPasswordController.text) {
      _showSnackBar('Password cannot be the same as before!', Colors.red);
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showSnackBar(
        'Password and confirm password is not the same!',
        Colors.red,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      Map<String, String> requestData = {
        "oldPassword": _oldPasswordController.text,
        "newPassword": _newPasswordController.text,
        "confirmPassword": _confirmPasswordController.text,
      };

      final message = await _apiService.changePassword(requestData);

      if (mounted) {
        _showSnackBar(message, Colors.green);
        Navigator.pop(context); // Đổi xong thì thoát về trang Profile
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
      appBar: AppBar(
        title: const Text(
          'Đổi mật khẩu',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLabel('Current password'),
              _buildPasswordField(
                _oldPasswordController,
                _obscureOld,
                () => setState(() => _obscureOld = !_obscureOld),
              ),
              const SizedBox(height: 16),

              const Divider(color: Color(0xFFF1F5F9), thickness: 1.5),
              const SizedBox(height: 16),

              _buildLabel('New password'),
              _buildPasswordField(
                _newPasswordController,
                _obscureNew,
                () => setState(() => _obscureNew = !_obscureNew),
              ),
              const SizedBox(height: 16),

              _buildLabel('Confirm password'),
              _buildPasswordField(
                _confirmPasswordController,
                _obscureConfirm,
                () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleChangePassword,
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
                          child: CircularProgressIndicator(color: Colors.white),
                        )
                      : const Text(
                          'Update password',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
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

  Widget _buildPasswordField(
    TextEditingController controller,
    bool isObscure,
    VoidCallback toggleVisibility,
  ) {
    return TextField(
      controller: controller,
      obscureText: isObscure,
      decoration: InputDecoration(
        prefixIcon: const Icon(
          Icons.lock_outline,
          size: 20,
          color: Colors.grey,
        ),
        suffixIcon: IconButton(
          icon: Icon(
            isObscure ? Icons.visibility_off : Icons.visibility,
            color: Colors.grey,
            size: 20,
          ),
          onPressed: toggleVisibility,
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
