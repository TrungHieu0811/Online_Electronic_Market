    package fpt.demo.controller;

import fpt.demo.dto.OrderRequest;
import fpt.demo.entity.Order;
import fpt.demo.service.CartItemService;
import fpt.demo.service.OrderService;
import fpt.demo.service.ShippingService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CartItemService cartItemService;
    private final ShippingService shippingService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            Principal principal,
            @RequestBody OrderRequest request) { // Nhận toàn bộ DTO từ Body

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in to continue!");
        }

        try {
            // Khớp với Service mới: truyền trực tiếp đối tượng request
            Order order = orderService.createOrder(principal.getName(), request);
            //return ResponseEntity.ok(order);
            return ResponseEntity.ok(java.util.Map.of("id", order.getId()));
        } catch (RuntimeException e) {
            e.printStackTrace();

            // Trả về mã 500 kèm nội dung lỗi cụ thể cho Postman xem
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Đã xảy ra lỗi: " + e.getMessage());
        }
    }

    @PostMapping("/buy-now")
    public ResponseEntity<?> buyNow(
            Principal principal,
            @RequestParam Integer productId,
            @RequestParam Integer quantity,
            @RequestBody OrderRequest request) { // Nhận JSON thông tin giao hàng

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in!");
        }

        try {
            Order order = orderService.buyNow(principal.getName(), productId, quantity, request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi mua nhanh: " + e.getMessage());
        }
    }

    @GetMapping("/preview-fee")
    public ResponseEntity<?> previewFee(
            @RequestParam Integer districtId,
            @RequestParam String wardCode,
            @RequestParam Double totalAmount) {
        try {
            double fee = orderService.previewShippingFee(districtId, wardCode, totalAmount);
            return ResponseEntity.ok(fee);
        } catch (Exception e) {
            // Trả về phí mặc định hoặc lỗi nếu API GHN có vấn đề
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(0.0);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Page<Order>> getMyOrders(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(orderService.getMyOrders(principal.getName(), page, size));
    }

    @GetMapping(value = "/provinces", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getProvinces() {
        String json = (String) shippingService.getGHNProvinces();
        if (json == null) {
            return ResponseEntity.status(503).body("{\"message\":\"GHN Service Unavailable\"}");
        }
        return ResponseEntity.ok(json);
    }
}
