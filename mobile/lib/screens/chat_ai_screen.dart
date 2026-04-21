import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart'; //
import '../services/chat_service.dart';
import 'product_detail_page.dart';

class ChatAIScreen extends StatefulWidget {
  const ChatAIScreen({super.key});

  @override
  State<ChatAIScreen> createState() => _ChatAIScreenState();
}

class _ChatAIScreenState extends State<ChatAIScreen>
    with TickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();

  final List<Map<String, dynamic>> _messages = [
    {
      "sender": "bot",
      "text": "Hello! I'm ElectroMart AI. How can I help you today?",
    },
  ];

  bool _isLoading = false;

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend() async {
    if (_controller.text.trim().isEmpty) return;

    final userMsg = _controller.text.trim();
    setState(() {
      _messages.add({"sender": "user", "text": userMsg});
      _isLoading = true;
      _controller.clear();
    });
    _scrollToBottom();

    final botResponse = await _chatService.sendMessage(userMsg);

    if (mounted) {
      setState(() {
        _messages.add({"sender": "bot", "text": botResponse});
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        title: const Text(
          "ELECTROMART AI",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: const Color(0xFF045fae),
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return _buildTypingIndicator(); // Hiện dấu ba chấm khi load
                }

                final m = _messages[index];
                bool isUser = m["sender"] == "user";
                return _renderMessage(m["text"].toString(), isUser);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _renderMessage(String text, bool isUser) {
    // 1. Định nghĩa Regex cho Sản phẩm và Đơn hàng
    final RegExp productRegex = RegExp(
      r'\[ID:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]',
    );
    final RegExp orderRegex = RegExp(
      r'\[ORDER:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]',
    );

    final List<Widget> children = [];
    int lastIndex = 0;

    // Tìm tất cả các khớp (matches) của cả 2 loại thẻ
    List<Map<String, dynamic>> allMatches = [];
    for (var m in productRegex.allMatches(text)) {
      allMatches.add({'type': 'product', 'match': m, 'start': m.start});
    }
    for (var m in orderRegex.allMatches(text)) {
      allMatches.add({'type': 'order', 'match': m, 'start': m.start});
    }

    // Sắp xếp theo thứ tự xuất hiện trong text
    allMatches.sort((a, b) => a['start'].compareTo(b['start']));

    for (var item in allMatches) {
      final Match match = item['match'];

      // Thêm đoạn text bình thường trước thẻ
      if (match.start > lastIndex) {
        children.add(
          _buildChatBubble(text.substring(lastIndex, match.start), isUser),
        );
      }

      if (item['type'] == 'product') {
        final String slug = match.group(1)!;
        String imageUrl = match.group(2)!;
        final String name = match.group(3)!;
        final String price = match.group(4)!;

        if (imageUrl == "no image" || imageUrl.isEmpty) {
          imageUrl = "https://via.placeholder.com/150";
        } else if (!imageUrl.startsWith("http")) {
          imageUrl = "http://10.0.2.2:8080/uploads/$imageUrl";
        }
        children.add(_buildProductCard(slug, imageUrl, name, price));
      } else {
        // Render Order Card
        children.add(
          _buildOrderCard(
            match.group(1)!, // ID
            match.group(2)!, // Status
            match.group(3)!, // Date
            match.group(4)!, // Total
            match.group(5)!, // Items
          ),
        );
      }
      lastIndex = match.end;
    }

    // Thêm đoạn text còn lại sau thẻ cuối cùng
    if (lastIndex < text.length) {
      children.add(_buildChatBubble(text.substring(lastIndex), isUser));
    }

    return Column(
      crossAxisAlignment: isUser
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: children,
    );
  }

Widget _buildChatBubble(String text, bool isUser) {
  if (text.trim().isEmpty) return const SizedBox.shrink();

  // Kiểm tra xem nội dung có chứa định dạng bảng Markdown không
  bool hasTable = text.contains('|') && text.contains('---');

  return Align(
    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      constraints: BoxConstraints(
        // Nếu có bảng, cho phép bubble chiếm tối đa màn hình để dễ cuộn
        maxWidth: MediaQuery.of(context).size.width * (hasTable ? 0.98 : 0.85),
      ),
      decoration: BoxDecoration(
        color: isUser ? const Color(0xFF045fae) : Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 2,
          )
        ],
      ),
      child: isUser
          ? Text(
              text.trim(),
              style: const TextStyle(color: Colors.white, fontSize: 14),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min, // Đảm bảo column không chiếm hết chiều dọc
              children: [
                if (hasTable)
                  // Theme này giúp ép Markdown render bảng rộng ra
                  Theme(
                    data: Theme.of(context).copyWith(
                      scrollbarTheme: ScrollbarThemeData(
                        thumbVisibility: WidgetStateProperty.all(true),
                      ),
                    ),
                    child: Scrollbar(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: IntrinsicWidth( // Ép các widget con (bảng) render hết độ rộng nội dung
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              // Tăng minWidth lên mức cao hơn để các cột không bị bóp
                              minWidth: MediaQuery.of(context).size.width * 1.5,
                            ),
                            child: MarkdownBody(
                              data: text.trim(),
                              selectable: true,
                              styleSheet: _getMarkdownStyle(),
                            ),
                          ),
                        ),
                      ),
                    ),
                  )
                else
                  MarkdownBody(
                    data: text.trim(),
                    selectable: true,
                    styleSheet: _getMarkdownStyle(),
                  ),
              ],
            ),
    ),
  );
}
MarkdownStyleSheet _getMarkdownStyle() {
  return MarkdownStyleSheet(
    p: const TextStyle(color: Colors.black87, fontSize: 14, height: 1.5),
    tableBody: const TextStyle(fontSize: 12),
    tableCellsPadding: const EdgeInsets.all(10),
    tableBorder: TableBorder.all(color: Colors.grey.shade300, width: 1),
    tableHead: const TextStyle(fontWeight: FontWeight.bold),
    // tableHeadDecoration: BoxDecoration(
    //   color: Colors.grey.shade100, // Thêm màu nền cho header bảng
    // ),
  );
}

  // Widget hiển thị thẻ Đơn hàng mới
  Widget _buildOrderCard(
    String id,
    String status,
    String date,
    String total,
    String items,
  ) {
    Color statusColor = status.contains('DELIVERED')
        ? Colors.green
        : (status.contains('CANCEL') ? Colors.red : Colors.orange);

    return Container(
      width: 280,
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Order $id",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF045fae),
                ),
              ),
              Text(
                date,
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ],
          ),
          const Divider(height: 16),
          Text.rich(
            TextSpan(
              children: [
                const TextSpan(
                  text: "Status: ",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                ),
                TextSpan(
                  text: status,
                  style: TextStyle(
                    fontSize: 12,
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Items: $items",
            style: const TextStyle(fontSize: 12, color: Colors.black87),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              "Total: $total",
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(
    String slug,
    String imageUrl,
    String name,
    String price,
  ) {
    return Container(
      width: 280,
      margin: const EdgeInsets.symmetric(vertical: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              imageUrl,
              width: 70,
              height: 70,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) =>
                  const Icon(Icons.image, size: 70, color: Colors.grey),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  price,
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (c) => ProductDetailPage(slug: slug),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF045fae),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(100, 28),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Text(
                    "View Details",
                    style: TextStyle(fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2),
          ],
        ),
        child: const SizedBox(
          width: 30,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _DotIndicator(),
              _DotIndicator(delay: Duration(milliseconds: 200)),
              _DotIndicator(delay: Duration(milliseconds: 400)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.black12)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: "Ask AI...",
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20),
              ),
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: const Color(0xFF045fae),
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white, size: 20),
              onPressed: _handleSend,
            ),
          ),
        ],
      ),
    );
  }
}

class _DotIndicator extends StatefulWidget {
  final Duration delay;
  const _DotIndicator({this.delay = Duration.zero});
  @override
  State<_DotIndicator> createState() => _DotIndicatorState();
}

class _DotIndicatorState extends State<_DotIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animation = Tween<double>(begin: 0.3, end: 1.0).animate(_controller);
    Future.delayed(widget.delay, () {
      if (mounted) _controller.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(
          color: Colors.grey,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
