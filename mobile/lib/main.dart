import 'package:electromart_flutter/screens/home_page.dart';
import 'package:electromart_flutter/screens/login_screen.dart';
import 'package:electromart_flutter/screens/main_page.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ElectroMart Test',
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      home: const MainPage(), // Gọi màn hình Register
      debugShowCheckedModeBanner: false,
    );
  }
}
