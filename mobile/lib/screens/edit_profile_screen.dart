import 'package:flutter/material.dart';
import '../services/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> currentData; // Nhận dữ liệu cũ từ trang Profile

  const EditProfileScreen({super.key, required this.currentData});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _avatarController;

  int? _selectedGender;
  bool _isLoading = false;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    // Đổ dữ liệu cũ vào các ô nhập liệu
    _nameController = TextEditingController(
      text: widget.currentData['fullName'],
    );
    _phoneController = TextEditingController(text: widget.currentData['phone']);
    _addressController = TextEditingController(
      text: widget.currentData['address'] ?? '',
    );
    _selectedGender = widget.currentData['gender'];
    _avatarController = TextEditingController(
      text: widget.currentData['avatarUrl'] ?? '',
    );
  }

  Future<void> _handleUpdate() async {
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      // Đóng gói dữ liệu mới
      Map<String, dynamic> updateData = {
        "fullName": _nameController.text.trim(),
        "phone": _phoneController.text.trim(),
        "address": _addressController.text.trim(),
        "gender": _selectedGender,
        "avatarUrl": _avatarController.text.trim(),
      };

      final message = await _apiService.updateUserProfile(updateData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.green),
        );
        Navigator.pop(
          context,
          true,
        ); // Trả về true để báo cho trang Profile biết cần tải lại dữ liệu
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text('Edit Profile'),
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
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.blue.shade50,
                      // Hiển thị ảnh preview nếu có link, không thì hiện icon person
                      backgroundImage: _avatarController.text.isNotEmpty
                          ? NetworkImage(_avatarController.text)
                          : null,
                      child: _avatarController.text.isEmpty
                          ? const Icon(
                              Icons.person,
                              size: 50,
                              color: Colors.blue,
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    _buildLabel('Avatar Image URL'),
                    TextField(
                      controller: _avatarController,
                      decoration: InputDecoration(
                        hintText: 'https://example.com/image.jpg',
                        prefixIcon: const Icon(
                          Icons.link,
                          size: 20,
                          color: Colors.grey,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 16,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      // Khi user gõ xong link, bấm enter thì cập nhật hình preview
                      onSubmitted: (val) => setState(() {}),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24), // Ngăn cách với các ô dưới

              _buildLabel('Full Name'),
              _buildTextField(_nameController, Icons.person_outline),
              const SizedBox(height: 16),
              _buildLabel('Full Name'),
              _buildTextField(_nameController, Icons.person_outline),
              const SizedBox(height: 16),

              _buildLabel('Phone Number'),
              _buildTextField(
                _phoneController,
                Icons.phone_outlined,
                isPhone: true,
              ),
              const SizedBox(height: 16),

              _buildLabel('Address'),
              _buildTextField(_addressController, Icons.location_on_outlined),
              const SizedBox(height: 16),

              _buildLabel('Gender'),
              DropdownButtonFormField<int>(
                value: _selectedGender,
                decoration: InputDecoration(
                  prefixIcon: const Icon(
                    Icons.wc,
                    color: Colors.grey,
                    size: 20,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                items: const [
                  DropdownMenuItem(value: 1, child: Text("Male")),
                  DropdownMenuItem(value: 0, child: Text("Female")),
                  DropdownMenuItem(value: 2, child: Text("Other")),
                ],
                onChanged: (val) => setState(() => _selectedGender = val),
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleUpdate,
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
                          'Save Changes',
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

  Widget _buildTextField(
    TextEditingController controller,
    IconData icon, {
    bool isPhone = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, size: 20, color: Colors.grey),
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
