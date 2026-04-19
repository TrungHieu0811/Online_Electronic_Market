export 'cart_item_model.dart';
export 'cart_model.dart';
export 'login_request.dart';
export 'register_request.dart';
export 'order_item_model.dart';
export 'order_model.dart';

class CategoryModel {
  final int id;
  final String name;
  final String slug;

  CategoryModel({required this.id, required this.name, required this.slug});

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}

class ProductModel {
  final int id;
  final String variantName;
  final double basePrice;
  final double? salePrice;
  final double averageRating;
  final String brandName;
  final String imageUrl;
  final String slug;

  ProductModel({
    required this.id,
    required this.variantName,
    required this.basePrice,
    this.salePrice,
    required this.averageRating,
    required this.brandName,
    required this.imageUrl,
    this.slug = '',
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // Xử lý lấy ảnh đầu tiên trong mảng imageList
    String thumbnail = 'https://via.placeholder.com/150';
    if (json['imageList'] != null && (json['imageList'] as List).isNotEmpty) {
      thumbnail = json['imageList'][0]['imageUrl'] ?? thumbnail;
      // Nếu API trả về đường dẫn tương đối, ghép thêm base URL
      if (!thumbnail.startsWith('http')) {
        thumbnail = 'http://10.0.2.2:8080/uploads$thumbnail';
      }
    }

    return ProductModel(
      id: json['id'] ?? 0,
      slug: json['slug'] ?? '',
      variantName: json['variantName'] ?? 'Unknown Product',
      basePrice: (json['basePrice'] ?? 0).toDouble(),
      salePrice: json['salePrice'] != null
          ? (json['salePrice']).toDouble()
          : null,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      brandName: json['brand'] != null
          ? json['brand']['name'] ?? 'Brand'
          : 'Brand',
      imageUrl: thumbnail,
    );
  }
}

class ProductDetailModel {
  final int id;
  final String variantName;
  final String slug;
  final String summary;
  final String description;
  final double basePrice;
  final double? salePrice;
  final double averageRating;
  final int viewCount;
  final List<String> images;
  final Map<String, String> attributes;

  ProductDetailModel({
    required this.id,
    required this.variantName,
    required this.slug,
    required this.summary,
    required this.description,
    required this.basePrice,
    this.salePrice,
    required this.averageRating,
    required this.viewCount,
    required this.images,
    required this.attributes,
  });

  factory ProductDetailModel.fromJson(Map<String, dynamic> json) {
    // 1. Trích xuất danh sách ảnh
    List<String> parsedImages = [];
    if (json['imageList'] != null) {
      for (var img in json['imageList']) {
        String url = img['imageUrl'] ?? '';
        if (!url.startsWith('http') && url.isNotEmpty) {
          url = 'http://10.0.2.2:8080/uploads$url';
        }
        parsedImages.add(url);
      }
    }
    // Nếu không có ảnh, gán ảnh mặc định
    if (parsedImages.isEmpty) {
      parsedImages.add('https://via.placeholder.com/400');
    }

    // 2. Trích xuất thuộc tính (Attributes)
    Map<String, String> parsedAttributes = {};
    if (json['attributes'] != null) {
      for (var attr in json['attributes']) {
        parsedAttributes[attr['name']] = attr['attrValue'];
      }
    }

    return ProductDetailModel(
      id: json['id'] ?? 0,
      variantName: json['variantName'] ?? '',
      slug: json['slug'] ?? '',
      summary: json['summary'] ?? '',
      description: json['description'] ?? '',
      basePrice: (json['basePrice'] ?? 0).toDouble(),
      salePrice: json['salePrice'] != null
          ? (json['salePrice']).toDouble()
          : null,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      viewCount: json['viewCount'] ?? 0,
      images: parsedImages,
      attributes: parsedAttributes,
    );
  }
}
