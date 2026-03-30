class RegisterRequest {
  final String username;
  final String email;
  final String phone;
  final String password;
  final String confirmPassword;
  final String fullName;

  RegisterRequest({
    required this.username,
    required this.email,
    required this.phone,
    required this.password,
    required this.confirmPassword,
    required this.fullName,
  });

  // Hàm này biến Object trong Dart thành chuỗi JSON để gửi xuống Backend
  Map<String, dynamic> toJson() {
    return {
      "username": username,
      "email": email,
      "phone": phone,
      "password": password,
      "confirmPassword": confirmPassword,
      "fullName": fullName,
    };
  }
}
