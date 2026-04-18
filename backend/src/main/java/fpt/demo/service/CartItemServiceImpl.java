package fpt.demo.service;

import fpt.demo.dto.CartItemRequest;
import fpt.demo.entity.*;
import fpt.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartItemServiceImpl implements CartItemService {

  private final CartItemRepository cartItemRepository;
  private final CartService cartService;
  private final ProductRepository productRepository;
  private final ProductImageRepository productImageRepository;

  @Override
  @Transactional
  public CartItem addToCart(String username, Integer productId, Integer quantity) {
    Cart cart = cartService.getOrCreateCart(username);
    Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found."));

    List<ProductImage> imgList = productImageRepository.findAllByProductId(productId);
    String imageUrl = null;
    if (imgList != null && !imgList.isEmpty()) {
      imageUrl = imgList.get(0).getImageUrl();
    }

    // 2. Kiểm tra nếu đã có trong giỏ thì cộng dồn
    CartItem item = cartItemRepository.findByCartAndProduct(cart, product)
            .orElse(new CartItem());

    int currentQuantity = (item.getId() == null) ? 0 : item.getQuantity();
    int newQuantity = currentQuantity + quantity;

    // 1. Kiểm tra tồn kho (Dựa trên field stockQuantity trong DBML của bạn)
//        if (product.getStockQuantity() < quantity) {
//            throw new RuntimeException("Số lượng tồn kho không đủ!");
//        }
    if (newQuantity > product.getStockQuantity()) {
      newQuantity = product.getStockQuantity();
    }

    if (item.getId() == null) {
      item.setCart(cart);
      item.setProduct(product);
      item.setImageUrl(imageUrl);
//            item.setQuantity(quantity);
    }

    item.setQuantity(newQuantity);

    return cartItemRepository.save(item);
  }

  @Override
  @Transactional
  public CartItem updateQuantity(Integer cartItemId, Integer quantity) {
    CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new RuntimeException("Item not found in your cart."));

    if (quantity <= 0) {
      cartItemRepository.delete(item);
      return null;
    }

    // 3. Kiểm tra tồn kho của sản phẩm
    Product product = item.getProduct();
    int finalQuantity = quantity;
    if (finalQuantity > product.getStockQuantity()) {
      finalQuantity = product.getStockQuantity();
    }

    item.setQuantity(finalQuantity);
    return cartItemRepository.save(item);
  }

  @Override
  @Transactional
  public void removeItem(Integer cartItemId) {
    cartItemRepository.deleteById(cartItemId);
  }

  @Override
  public List<CartItem> getMyCartItems(String username) {
    Cart cart = cartService.getOrCreateCart(username);
    return cartItemRepository.findByCart_Id(cart.getId());
  }

  @Override
  @Transactional
  public CartItem toggleSelection(Integer cartItemId) {
    CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new RuntimeException("Product not found in cart."));

    // Đảo ngược trạng thái hiện tại
    item.setIsSelected(!item.getIsSelected());
    return cartItemRepository.save(item);
  }

  @Override
  @Transactional(readOnly = true)
  public List<CartItem> getFullCartDetails(String username) {
    Cart cart = cartService.getOrCreateCart(username);
    // Gọi hàm có EntityGraph mới tạo
    return cartItemRepository.findFullDetailsByCart_Id(cart.getId());
  }

  @Override
  public Integer getCartCount(String username) {
    Cart cart = cartService.getOrCreateCart(username);
    // Chỉ cần lấy size của danh sách các loại mặt hàng
    return cartItemRepository.findByCart_Id(cart.getId()).size();
  }

  @Override
  @Transactional
  public void toggleAllSelection(String username, boolean selected) {
    Cart cart = cartService.getOrCreateCart(username);
    List<CartItem> items = cartItemRepository.findByCart_Id(cart.getId());

    for (CartItem item : items) {
      item.setIsSelected(selected);
    }
    cartItemRepository.saveAll(items);
  }

  @Override
  @Transactional
  public void removeMultipleItems(List<Integer> ids) {
    if (ids == null || ids.isEmpty()) {
      return;
    }
    try {
      cartItemRepository.deleteAllByIdIn(ids);
    } catch (Exception e) {
      throw new RuntimeException("Error deleting product list." + e.getMessage());
    }
  }

  @Override
  @Transactional
  public void mergeCart(String username, List<CartItemRequest> guestItems) {
    Cart cart = cartService.getOrCreateCart(username);

    for (CartItemRequest item : guestItems) {
      Product product = productRepository.findById(item.getProductId())
              .orElseThrow(() -> new RuntimeException("This product is no longer available."));

      // Tìm item cũ trong DB
      CartItem cartItem = cartItemRepository
              .findByCart_IdAndProduct_Id(cart.getId(), item.getProductId())
              .orElse(new CartItem());

      if (cartItem.getId() == null) {
        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setIsSelected(true);
      }

      // Logic cộng dồn và ép về stockQuantity
      int newQuantity = (cartItem.getQuantity() != null ? cartItem.getQuantity() : 0) + item.getQuantity();
      if (newQuantity > product.getStockQuantity()) {
        newQuantity = product.getStockQuantity();
      }

      cartItem.setQuantity(newQuantity);
      cartItemRepository.save(cartItem);
    }
  }
}
