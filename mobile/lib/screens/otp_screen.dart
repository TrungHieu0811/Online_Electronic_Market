import 'dart:async'; // BẮT BUỘC THÊM ĐỂ DÙNG TIMER
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class OtpScreen extends StatefulWidget {
  final String email;

  const OtpScreen({super.key, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;

  // BIẾN CHO ĐỒNG HỒ ĐẾM NGƯỢC
  Timer? _timer;
  int _countdown = 60; // 60 giây chờ
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startTimer(); // Vừa vào màn hình là bắt đầu đếm ngược luôn
  }

  void _startTimer() {
    setState(() {
      _countdown = 60;
      _canResend = false;
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown == 0) {
        setState(() {
          _canResend = true; // Hết giờ -> Cho phép bấm nút Gửi lại
        });
        timer.cancel();
      } else {
        setState(() {
          _countdown--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel(); // Dọn dẹp timer khi thoát màn hình để tránh lỗi bộ nhớ
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    FocusScope.of(context).unfocus();

    if (_otpController.text.length < 6) {
      _showSnackBar('Please enter 6-digit OTP', Colors.orange);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final message = await _apiService.verifyEmail(
        widget.email,
        _otpController.text,
      );

      if (mounted) {
        _showSnackBar(message, Colors.green);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar(e.toString().replaceAll('Exception: ', ''), Colors.red);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // HÀM XỬ LÝ KHI BẤM NÚT "GỬI LẠI MÃ"
  Future<void> _handleResendOtp() async {
    setState(() => _canResend = false); // Tạm khóa nút lại ngay lập tức
    _showSnackBar('Resending OTP', Colors.blue);

    try {
      final message = await _apiService.resendOtp(widget.email);
      if (mounted) {
        _showSnackBar(message, Colors.green);
        _startTimer(); // Gửi thành công thì bắt đầu đếm ngược lại 60s
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _canResend = true,
        ); // Nếu lỗi, mở lại nút cho người ta bấm
        _showSnackBar(e.toString().replaceAll('Exception: ', ''), Colors.red);
      }
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
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
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
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mark_email_read_outlined,
                    size: 40,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Validate email',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'We have sent the code to \n${widget.email}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey, height: 1.5),
                ),
                const SizedBox(height: 32),

                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    fontSize: 32,
                    letterSpacing: 8,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                  decoration: InputDecoration(
                    counterText: "",
                    hintText: "000000",
                    hintStyle: TextStyle(color: Colors.grey.shade300),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFF4F46E5),
                        width: 2,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleVerify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
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
                            'Confirm',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 24),

                // NÚT GỬI LẠI MÃ KÈM ĐẾM NGƯỢC
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Have not received OTP?",
                      style: TextStyle(color: Colors.grey),
                    ),
                    TextButton(
                      // Nếu _canResend = true thì cho bấm, ngược lại thì khóa nút (null)
                      onPressed: _canResend ? _handleResendOtp : null,
                      child: Text(
                        _canResend
                            ? 'Resend OTP'
                            : 'Resend OTP after ${_countdown}s',
                        style: TextStyle(
                          color: _canResend
                              ? Colors.blue
                              : Colors.grey.shade400,
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
    );
  }
}
