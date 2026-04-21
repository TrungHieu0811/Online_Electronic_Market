import 'package:electromart_flutter/models/comment_model.dart';
import 'package:electromart_flutter/models/models.dart';
import 'package:electromart_flutter/screens/product_detail_page.dart';
import 'package:electromart_flutter/services/api_service.dart';
import 'package:flutter/material.dart';

class CommentThreadPage extends StatefulWidget {
  final int productId;
  final int? focusCommentId;

  const CommentThreadPage({
    super.key,
    required this.productId,
    this.focusCommentId,
  });

  @override
  State<CommentThreadPage> createState() => _CommentThreadPageState();
}

class _CommentThreadPageState extends State<CommentThreadPage> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final Map<int, GlobalKey> _commentKeys = {};
  final TextEditingController _commentController = TextEditingController();

  ProductModel? _productInfo;
  List<CommentModel> _comments = [];

  bool _loading = true;
  bool _commentLoading = true;
  bool _isPostingComment = false;

  int? _replyingToCommentId;
  String? _replyingToUsername;
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _initUser();
    _fetchAll();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initUser() async {
    try {
      final userData = await _apiService.getUserProfile();
      if (!mounted) return;

      setState(() {
        _currentUserId = userData['id'] as int?;
      });
    } catch (e) {
      debugPrint('Không lấy được current user: $e');
    }
  }

  GlobalKey _getCommentKey(int commentId) {
    return _commentKeys.putIfAbsent(commentId, () => GlobalKey());
  }

  Future<void> _fetchAll() async {
    setState(() {
      _loading = true;
      _commentLoading = true;
    });

    await Future.wait([_fetchProductInfo(), _fetchComments()]);

    if (!mounted) return;

    setState(() {
      _loading = false;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToFocusedComment();
    });
  }

  Future<void> _fetchProductInfo() async {
    try {
      final data = await _apiService.get(
        '/public/products/${widget.productId}/basic-info',
      );

      if (!mounted) return;
      setState(() {
        _productInfo = ProductModel.fromJson(data);
      });
    } catch (e) {
      debugPrint('Lỗi load product info: $e');
    }
  }

  Future<void> _fetchComments() async {
    try {
      final comments = await _apiService.getCommentsByProduct(widget.productId);

      if (!mounted) return;
      setState(() {
        _comments = comments;
      });
    } catch (e) {
      debugPrint('Lỗi load comment thread: $e');
    } finally {
      if (mounted) {
        setState(() {
          _commentLoading = false;
        });
      }
    }
  }

  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    setState(() {
      _isPostingComment = true;
    });

    try {
      await _apiService.postComment(
        productId: widget.productId,
        content: content,
        parentId: _replyingToCommentId,
      );

      _commentController.clear();

      setState(() {
        _replyingToCommentId = null;
        _replyingToUsername = null;
      });

      await _fetchComments();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment posted successfully')),
      );

      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToFocusedComment();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isPostingComment = false;
      });
    }
  }

  void _scrollToFocusedComment() {
    final focusId = widget.focusCommentId;
    if (focusId == null) return;

    final key = _commentKeys[focusId];
    final ctx = key?.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.2,
      );
    }
  }

  bool _isHighlighted(CommentModel comment) {
    return comment.id == widget.focusCommentId;
  }

  String _displayName(CommentModel comment) {
    return comment.user?.username ??
        comment.user?.username ??
        (comment.isAdminReply == true ? 'Admin' : 'User');
  }

  bool _canReply(CommentModel comment) {
    return comment.isAdminReply == true || comment.user?.id == _currentUserId;
  }

  Widget _buildCommentCard(CommentModel comment, {bool isReply = false}) {
    final highlighted = _isHighlighted(comment);
    final canReply = _canReply(comment);

    return Container(
      key: comment.id != null ? _getCommentKey(comment.id!) : null,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: highlighted
            ? const Color(0xFFFFF8E1)
            : (comment.isAdminReply == true
                  ? const Color(0xFFF2F8FF)
                  : Colors.white),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: highlighted
              ? Colors.orange
              : (comment.isAdminReply == true
                    ? const Color(0xFF90CAF9)
                    : Colors.grey.shade200),
          width: highlighted ? 1.6 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: comment.isAdminReply == true
                    ? const Color(0xFF045fae)
                    : Colors.grey,
                child: Icon(
                  comment.isAdminReply == true
                      ? Icons.admin_panel_settings
                      : Icons.person,
                  color: Colors.white,
                  size: 16,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _displayName(comment),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              if (comment.isAdminReply == true)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF045fae),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'Admin reply',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            comment.content ?? '',
            style: const TextStyle(fontSize: 14, height: 1.45),
          ),
          const SizedBox(height: 8),
          if (canReply)
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _replyingToCommentId = comment.id;
                  _replyingToUsername = _displayName(comment);
                });
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              icon: const Icon(Icons.reply, size: 15),
              label: const Text(
                'Reply',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          if (highlighted) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'This is the comment/response that has just been notified.',
                style: TextStyle(
                  color: Colors.orange,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCommentItem(CommentModel comment, {double leftPadding = 0}) {
    return Padding(
      padding: EdgeInsets.only(left: leftPadding, bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCommentCard(comment, isReply: leftPadding > 0),

          if (comment.replies.isNotEmpty)
            ...comment.replies.map(
              (reply) =>
                  _buildCommentItem(reply, leftPadding: leftPadding + 20),
            ),
        ],
      ),
    );
  }

  Widget _buildCommentThread() {
    if (_commentLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_comments.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Text(
          'Chưa có bình luận nào.',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return Column(
      children: _comments.map((comment) => _buildCommentItem(comment)).toList(),
    );
  }

  Widget _buildCommentInputBox() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_replyingToCommentId != null)
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF045fae).withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Replying to ${_replyingToUsername ?? 'comment'}',
                    style: const TextStyle(
                      color: Color(0xFF045fae),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _replyingToCommentId = null;
                      _replyingToUsername = null;
                    });
                  },
                  child: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
          ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.blueGrey.shade100,
                child: const Icon(
                  Icons.person,
                  size: 18,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _commentController,
                  minLines: 1,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: _replyingToCommentId != null
                        ? 'Write a reply...'
                        : 'Write a comment...',
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                decoration: BoxDecoration(
                  color: _isPostingComment
                      ? Colors.grey
                      : const Color(0xFF045fae),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  onPressed: _isPostingComment ? null : _submitComment,
                  icon: _isPostingComment
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF045fae);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: const Text(
          'Comment Thread',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchAll,
              child: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'COMMENT THREAD',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _productInfo?.variantName ??
                              'Product #${widget.productId}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Bạn đang xem cuộc trò chuyện liên quan đến sản phẩm này.',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Back'),
                            ),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryColor,
                              ),
                              onPressed: () {
                                if (_productInfo?.slug != null &&
                                    _productInfo!.slug.isNotEmpty) {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ProductDetailPage(
                                        slug: _productInfo!.slug,
                                      ),
                                    ),
                                  );
                                }
                              },
                              icon: const Icon(
                                Icons.shopping_bag_outlined,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'Back to Product',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildCommentThread(),
                  const SizedBox(height: 16),
                  _buildCommentInputBox(),
                ],
              ),
            ),
    );
  }
}
