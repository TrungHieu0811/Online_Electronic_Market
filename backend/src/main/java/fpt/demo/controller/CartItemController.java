package fpt.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.dto.CartItemRequest;
import fpt.demo.entity.CartItem;
import fpt.demo.service.CartItemService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public/cart-items")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = { RequestMethod.GET, RequestMethod.POST,
        RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS })
public class CartItemController {

    private final CartItemService cartItemService;

    // Lấy danh sách sản phẩm trong giỏ của người dùng đang đăng nhập
    // @GetMapping
    // public ResponseEntity<?> getMyCart(Principal principal) {
    // if (principal == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in to
    // continue!");
    // }
    // return
    // ResponseEntity.ok(cartItemService.getMyCartItems(principal.getName()));
    // }
    @GetMapping
    public ResponseEntity<?> getMyCart(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in to continue!");
        }
        // Sử dụng hàm getFullCartDetails mới tạo
        return ResponseEntity.ok(cartItemService.getFullCartDetails(principal.getName()));
    }

    // Thêm sản phẩm vào giỏ
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            Principal principal,
            @RequestParam Integer productId,
            @RequestParam Integer quantity) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in to continue!");
        }

        try {
            CartItem result = cartItemService.addToCart(principal.getName(), productId, quantity);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Cập nhật số lượng item
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Integer id,
            @RequestParam Integer quantity) {
        try {
            CartItem updated = cartItemService.updateQuantity(id, quantity);

            // Nếu Service trả về null, nghĩa là sản phẩm đã bị xóa do quantity <= 0
            if (updated == null) {
                return ResponseEntity.ok("Item removed because quantity was set to 0.");
            }

            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xóa sản phẩm khỏi giỏ
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeItem(@PathVariable Integer id) {
        cartItemService.removeItem(id);
        return ResponseEntity.ok("Product removed successfully!");
    }

    /**
     * Thay đổi trạng thái checkbox (Chọn/Bỏ chọn sản phẩm để thanh toán) URL:
     * PATCH /api/users/cart-items/{id}/toggle-selection
     */
    @PatchMapping("/{id}/toggle-selection")
    public ResponseEntity<?> toggleSelection(@PathVariable Integer id) {
        try {
            CartItem updatedItem = cartItemService.toggleSelection(id);
            return ResponseEntity.ok(updatedItem);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartCount(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(0);
        }
        return ResponseEntity.ok(cartItemService.getCartCount(principal.getName()));
    }

    @PatchMapping("/toggle-all")
    public ResponseEntity<?> toggleAllSelection(
            Principal principal,
            @RequestParam boolean selected) {
        try {
            cartItemService.toggleAllSelection(principal.getName(), selected);
            return ResponseEntity.ok("Updated all items successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/remove-multiple")
    public ResponseEntity<?> removeMultiple(@RequestBody List<Integer> ids) {
        try {
            cartItemService.removeMultipleItems(ids);
            return ResponseEntity.ok("Selected products deleted successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/merge")
    public ResponseEntity<?> mergeCart(Principal principal, @RequestBody List<CartItemRequest> guestItems) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        cartItemService.mergeCart(principal.getName(), guestItems);
        return ResponseEntity.ok("Giỏ hàng đã được đồng bộ!");
    }

}
