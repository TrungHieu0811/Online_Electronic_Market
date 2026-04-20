import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> currentData;

  const EditProfileScreen({super.key, required this.currentData});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;

  int? _selectedGender;
  bool _isLoading = false;
  final ApiService _apiService = ApiService();

  // 👉 THÊM: Biến lưu trữ file ảnh được chọn từ thiết bị
  File? _selectedImageFile;
  String? _currentAvatarUrl;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.currentData['fullName'],
    );
    _phoneController = TextEditingController(text: widget.currentData['phone']);
    _addressController = TextEditingController(
      text: widget.currentData['address'] ?? '',
    );
    _selectedGender = widget.currentData['gender'];

    // Lưu lại URL cũ để hiển thị nếu user không chọn ảnh mới
    _currentAvatarUrl = widget.currentData['avatarUrl'] ?? '';
  }

  // 👉 HÀM GỌI THƯ VIỆN ẢNH ĐÃ ĐƯỢC BỌC TRY-CATCH
  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      // Mở thư viện ảnh
      final XFile? pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
      );

      if (pickedFile != null) {
        setState(() {
          _selectedImageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      print("=== [DEBUG] LỖI CHỌN ẢNH: $e ===");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể mở thư viện ảnh: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleUpdate() async {
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      // Đóng gói các dữ liệu dạng Text
      Map<String, dynamic> updateData = {
        "fullName": _nameController.text.trim(),
        "phone": _phoneController.text.trim(),
        "address": _addressController.text.trim(),
        "gender": _selectedGender,
      };

      // GỌI API:
      // LƯU Ý: Nếu có _selectedImageFile, bạn cần sử dụng MultipartRequest
      // trong ApiService thay vì gửi JSON thông thường.
      final message = await _apiService.updateUserProfile(
        data: updateData,
        imageFile:
            _selectedImageFile, // 👉 Truyền thêm file ảnh vào API Service
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true);
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
                    // 👉 KHU VỰC AVATAR ĐÃ ĐƯỢC NÂNG CẤP
                    GestureDetector(
                      onTap: _pickImage, // Bấm vào để chọn ảnh
                      child: Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.blue.withOpacity(0.2),
                                width: 3,
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 50,
                              backgroundColor: Colors.blue.shade50,
                              // Ưu tiên hiển thị file ảnh cục bộ, nếu không có mới load URL mạng
                              // Ưu tiên hiển thị file ảnh cục bộ, nếu không có mới load URL mạng
                              backgroundImage: _selectedImageFile != null
                                  ? FileImage(_selectedImageFile!)
                                        as ImageProvider
                                  : (_currentAvatarUrl!.isNotEmpty
                                        ? NetworkImage(
                                            _currentAvatarUrl!.startsWith(
                                                  'http',
                                                )
                                                ? _currentAvatarUrl!
                                                : '${ApiService.getBaseUrl.replaceAll('/api', '')}/uploads$_currentAvatarUrl',
                                          )
                                        : null),
                              child:
                                  _selectedImageFile == null &&
                                      _currentAvatarUrl!.isEmpty
                                  ? const Icon(
                                      Icons.person,
                                      size: 50,
                                      color: Colors.blue,
                                    )
                                  : null,
                            ),
                          ),

                          // Icon máy ảnh nổi lên trên góc dưới cùng bên phải
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFff6b00), // Màu cam
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
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
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Tap to change photo',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Các TextField còn lại giữ nguyên
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
