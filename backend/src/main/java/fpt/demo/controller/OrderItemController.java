package fpt.demo.controller;

import fpt.demo.entity.OrderItem;
import fpt.demo.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/order-details")
@RequiredArgsConstructor
public class OrderItemController {

    private final OrderItemService orderItemService;

    // Lấy chi tiết các sản phẩm của một đơn hàng
    @GetMapping("/{orderId}")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Integer orderId) {
        List<OrderItem> items = orderItemService.getItemsByOrderId(orderId);
        return ResponseEntity.ok(items);
    }
}