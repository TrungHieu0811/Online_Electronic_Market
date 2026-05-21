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

        // Lấy link ảnh
        List<ProductImage> imgList = productImageRepository.findAllByProductId(productId);
        String imageUrl = (imgList != null && !imgList.isEmpty()) ? imgList.get(0).getImageUrl() : null;

        CartItem item = cartItemRepository.findByCartAndProduct(cart, product)
                .orElse(new CartItem());

        // LUÔN LUÔN cập nhật lại imageUrl để sửa các data bị lỗi cũ
        item.setImageUrl(imageUrl);

        int currentQuantity = (item.getId() == null) ? 0 : item.getQuantity();
        int newQuantity = currentQuantity + quantity;

        if (newQuantity > product.getStockQuantity()) {
            newQuantity = product.getStockQuantity();
        }

        if (item.getId() == null) {
            item.setCart(cart);
            item.setProduct(product);
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
                    .orElseThrow(() -> new RuntimeException("Product not found."));

            // Kiểm tra xem User đã có món này trong DB chưa
            Optional<CartItem> existingItem = cartItemRepository
                    .findByCart_IdAndProduct_Id(cart.getId(), item.getProductId());

            if (existingItem.isPresent()) {
                // TRƯỜNG HỢP 1: ĐÃ CÓ - Thực hiện cộng dồn
                CartItem cartItem = existingItem.get();
                int newQuantity = cartItem.getQuantity() + item.getQuantity();

                // Khống chế theo tồn kho
                if (newQuantity > product.getStockQuantity()) {
                    newQuantity = product.getStockQuantity();
                }
                cartItem.setQuantity(newQuantity);

                //            // Cập nhật lại ảnh nếu data cũ bị thiếu
                if (item.getImageUrl() != null && !item.getImageUrl().equals("undefined")) {
                    cartItem.setImageUrl(item.getImageUrl());
                } else {
                    // Nếu Guest gửi lên rỗng, cố gắng lấy mainImage của Product làm cứu cánh
                    List<ProductImage> imgs = productImageRepository.findAllByProductId(product.getId());
                    if (imgs != null && !imgs.isEmpty()) {
                        cartItem.setImageUrl(imgs.get(0).getImageUrl());
                    }
                }
                cartItemRepository.save(cartItem);
            } else {
                // TRƯỜNG HỢP 2: CHƯA CÓ - Tạo mới hoàn toàn
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setQuantity(item.getQuantity());
                newItem.setIsSelected(true);

                // Gán ảnh thông minh: Kiểm tra null, "undefined" và rỗng
                if (item.getImageUrl() != null
                        && !item.getImageUrl().equals("undefined")
                        && !item.getImageUrl().trim().isEmpty()) {

                    newItem.setImageUrl(item.getImageUrl());
                } else {
                    // Cứu cánh lấy ảnh từ DB
                    List<ProductImage> imgs = productImageRepository.findAllByProductId(product.getId());
                    if (imgs != null && !imgs.isEmpty()) {
                        newItem.setImageUrl(imgs.get(0).getImageUrl());
                    }
                }
                cartItemRepository.save(newItem);
            }
        }
    }
}
