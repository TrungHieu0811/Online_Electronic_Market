package fpt.demo.controller;

import fpt.demo.entity.Category;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.Product;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "30days") String range
    ) {
        List<Product> products = productRepository.findAll();
        List<Order> allOrders = orderRepository.findAll();
        List<OrderItem> allOrderItems = orderItemRepository.findAll();

        long totalProducts = products.size();
        long totalUsers = userRepository.count();
        long totalOrders = allOrders.size();

        // tổng revenue toàn bộ hệ thống (card trên cùng)
        double totalRevenue = allOrders.stream()
                .filter(order -> order.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalPayPrice)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();

        // lọc dữ liệu theo range cho 2 block dưới + recent orders
        LocalDateTime startDate = resolveStartDate(range);

        List<Order> filteredDeliveredOrders = allOrders.stream()
                .filter(order -> order.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !order.getCreatedAt().isBefore(startDate))
                .collect(Collectors.toList());

        Set<Integer> filteredDeliveredOrderIds = filteredDeliveredOrders.stream()
                .map(Order::getId)
                .collect(Collectors.toSet());

        List<OrderItem> filteredOrderItems = allOrderItems.stream()
                .filter(item -> item.getOrder() != null && item.getOrder().getId() != null)
                .filter(item -> filteredDeliveredOrderIds.contains(item.getOrder().getId()))
                .collect(Collectors.toList());

        // revenue summary cho phần dưới
        double filteredRevenue = filteredDeliveredOrders.stream()
                .map(Order::getTotalPayPrice)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();

        // revenue chart theo tháng
        Map<YearMonth, Double> revenueMap = new TreeMap<>();
        for (Order order : filteredDeliveredOrders) {
            if (order.getCreatedAt() != null && order.getTotalPayPrice() != null) {
                YearMonth ym = YearMonth.from(order.getCreatedAt());
                revenueMap.put(ym, revenueMap.getOrDefault(ym, 0.0) + order.getTotalPayPrice());
            }
        }

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        List<RevenueItemDto> revenueByMonth = revenueMap.entrySet().stream()
                .map(entry -> new RevenueItemDto(
                        entry.getKey().format(monthFormatter),
                        entry.getValue()
                ))
                .collect(Collectors.toList());

        // top categories theo revenue trong range
        Map<String, Double> categoryRevenueMap = new HashMap<>();

        for (OrderItem item : filteredOrderItems) {
            if (item.getProduct() == null || item.getProduct().getGroup() == null) {
                continue;
            }

            Category category = item.getProduct().getGroup().getCategory();
            String categoryName = (category != null && category.getName() != null)
                    ? category.getName()
                    : "Unknown";

            double price = item.getPriceAtPurchase() != null ? item.getPriceAtPurchase() : 0.0;
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            double revenue = price * quantity;

            categoryRevenueMap.put(
                    categoryName,
                    categoryRevenueMap.getOrDefault(categoryName, 0.0) + revenue
            );
        }

        List<CategoryItemDto> topCategories = categoryRevenueMap.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(entry -> new CategoryItemDto(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // recent orders trong range
        List<RecentOrderDto> recentOrders = filteredDeliveredOrders.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .map(order -> new RecentOrderDto(
                        order.getId(),
                        order.getShippingName(),
                        order.getTotalPayPrice(),
                        order.getOrderStatus() != null ? order.getOrderStatus().name() : null,
                        order.getPaymentStatus(),
                        order.getCreatedAt() != null ? order.getCreatedAt().toString() : null
                ))
                .collect(Collectors.toList());

        DashboardResponse response = new DashboardResponse(
                totalProducts,
                totalUsers,
                totalOrders,
                totalRevenue,
                range,
                filteredRevenue,
                revenueByMonth,
                topCategories,
                recentOrders
        );

        return ResponseEntity.ok(response);
    }

    private LocalDateTime resolveStartDate(String range) {
        LocalDate today = LocalDate.now();

        switch (range.toLowerCase()) {
            case "6months":
                return today.minusMonths(6).atStartOfDay();
            case "ytd":
                return LocalDate.of(today.getYear(), 1, 1).atStartOfDay();
            case "30days":
            default:
                return today.minusDays(30).atStartOfDay();
        }
    }

    // ================= DTO =================

    @Data
    @AllArgsConstructor
    static class DashboardResponse {
        private long totalProducts;
        private long totalUsers;
        private long totalOrders;
        private double totalRevenue;

        private String range;
        private double filteredRevenue;

        private List<RevenueItemDto> revenueByMonth;
        private List<CategoryItemDto> topCategories;
        private List<RecentOrderDto> recentOrders;
    }

    @Data
    @AllArgsConstructor
    static class RevenueItemDto {
        private String label;
        private double value;
    }

    @Data
    @AllArgsConstructor
    static class CategoryItemDto {
        private String name;
        private double value;
    }

    @Data
    @AllArgsConstructor
    static class RecentOrderDto {
        private Integer id;
        private String customerName;
        private Double totalPayPrice;
        private String orderStatus;
        private String paymentStatus;
        private String createdAt;
    }
}