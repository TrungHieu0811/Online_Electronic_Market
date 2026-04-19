import 'package:electromart_flutter/screens/cart_screen.dart';
import 'package:electromart_flutter/screens/profile_screen.dart';
import 'package:electromart_flutter/services/cart_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'home_page.dart';
import 'chat_ai_screen.dart';

class MainPage extends StatefulWidget {
  final int initialIndex;

  const MainPage({super.key, this.initialIndex = 0});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  final Color primaryColor = const Color(0xFF045fae);
  final Color secondaryColor = const Color(0xFFff8c00);

  int _selectedIndex = 0;
  int _cartCount = 0;
  final CartService _cartService = CartService();
  final GlobalKey<CartScreenState> cartKey = GlobalKey<CartScreenState>();

  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();

    _pages = [
      HomePage(), // 0
      CartScreen(key: cartKey), // 1
      ChatAIScreen(), // 2
      ProfileScreen(), // 3
    ];

    _selectedIndex =
        (widget.initialIndex >= 0 && widget.initialIndex < _pages.length)
        ? widget.initialIndex
        : 0;

    _loadCartCount();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (_selectedIndex == 1) {
        await cartKey.currentState?.fetchCart();
        if (!mounted) return;
        setState(() {
          _cartCount = cartKey.currentState?.items.length ?? _cartCount;
        });
      }
    });
  }

  Future<void> _loadCartCount() async {
    const storage = FlutterSecureStorage();
    String? token = await storage.read(key: 'jwt_token');

    int count = 0;
    if (token != null) {
      count = await _cartService.getCartCountFromApi(token);
    } else {
      final guestItems = await _cartService.getGuestCart();
      count = guestItems.length;
    }

    if (mounted) {
      setState(() {
        _cartCount = count;
      });
    }
  }

  Future<void> refreshBadge() async {
    await _loadCartCount();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: _buildBottomNavbar(),
    );
  }

  Widget _buildBottomNavbar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey.shade300)),
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) async {
          setState(() {
            _selectedIndex = index;
          });

          if (index == 1) {
            await cartKey.currentState?.fetchCart();
            if (!mounted) return;
            setState(() {
              _cartCount = cartKey.currentState?.items.length ?? _cartCount;
            });
          }
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.grey,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        elevation: 0,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
          BottomNavigationBarItem(icon: _buildCartBadge(), label: "Cart"),
          const BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            label: "Chat AI",
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: "Profile",
          ),
        ],
      ),
    );
  }

  Widget _buildCartBadge() {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        const Icon(Icons.shopping_bag_outlined),
        if (_cartCount > 0)
          Positioned(
            top: -4,
            right: -8,
            child: Container(
              padding: const EdgeInsets.all(4),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              decoration: BoxDecoration(
                color: secondaryColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              child: Text(
                _cartCount > 9 ? "9+" : "$_cartCount",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
