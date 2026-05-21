package fpt.demo.service;

import fpt.demo.dto.OrderStatsDTO;
import fpt.demo.entity.Coupon;
import java.util.List;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderEvidence;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.OrderManagement;
import fpt.demo.entity.PaymentLogManagement;
import fpt.demo.entity.Product;
import fpt.demo.entity.User;
import fpt.demo.repository.CouponRepository;
import fpt.demo.repository.OrderEvidenceRepository;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.OrderManagementRepository;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.PaymentLogManagementRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderManagementServiceImpl implements OrderManagementService {

    private final OrderManagementRepository managementRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderEvidenceRepository evidenceRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final OrderItemRepository orderItemRepository;
    private final PayPalService paypalService;
    private final PaymentLogManagementRepository paymentLogRepository;

    @Override
    @Transactional
    public void updateOrderStatus(Integer orderId, String username, String newStatus, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User admin = userRepository.findByUsername(username).orElse(null);

        // 1. Lưu trạng thái cũ
        String oldStatus = order.getOrderStatus().name();

        // 2. Convert String -> Enum
        Order.OrderStatus statusEnum;
        try {
            statusEnum = Order.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái đơn hàng không hợp lệ: " + newStatus);
        }

        // 3. Cập nhật trạng thái mới
        order.setOrderStatus(statusEnum);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 4. Ghi log
        OrderManagement log = new OrderManagement();
        log.setOrder(order);
        log.setAdmin(admin); // Nếu admin null, log vẫn lưu được (hệ thống làm)
        log.setActionType(statusEnum.getRelatedAction());
        log.setPreviousStatus(oldStatus);
        log.setNewStatus(statusEnum.name());
        log.setReason(username.equals("SYSTEM") ? "[Auto] " + reason : reason);
        log.setCreatedAt(LocalDateTime.now());

        managementRepository.save(log);
    }

//    @Override
//    public List<OrderManagement> getHistoryByActionType(String actionType) {
//        // Chuyển về chữ hoa để khớp với dữ liệu thường lưu trong DB
//        return managementRepository.findByActionTypeOrderByCreatedAtDesc(actionType.toUpperCase());
//    }
    @Override
    public List<OrderManagement> getHistoryByOrder(Integer orderId) {
        return managementRepository.findByOrder_IdOrderByCreatedAtDesc(orderId);
    }

    @Override
    public Page<Order> findAllOrders(int page, int size, String status, String sortField, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortField).ascending() 
                : Sort.by(sortField).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && !status.isEmpty()) {
            try {
                Order.OrderStatus statusEnum = Order.OrderStatus.valueOf(status.toUpperCase());
                // PHẢI dùng pageable ở đây để Sort có tác dụng khi lọc theo Tab
                return orderRepository.findByOrderStatus(statusEnum, pageable);
            } catch (IllegalArgumentException e) {
                // Nếu status không hợp lệ, quay về mặc định
            }
        }

        // Mặc định lấy tất cả
        return orderRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public void processAIVerification(Integer orderId, String imageUrl, boolean isValid, String labels) {
        // 1. Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        // 2. Lưu vào bảng bằng chứng (Yêu cầu của nhóm trưởng)
        OrderEvidence evidence = new OrderEvidence();
        evidence.setOrder(order);
        evidence.setImageUrl(imageUrl);
        evidence.setAiLabels(labels);
        evidence.setIsValid(isValid);
        evidence.setCreatedAt(LocalDateTime.now());
        evidenceRepository.save(evidence);

        // 3. Nếu AI xác nhận là ảnh giao hàng (isValid = true)
        if (isValid) {
            // Cập nhật trạng thái đơn hàng sang DELIVERED
            // Username truyền vào có thể để là "SYSTEM_AI" để phân biệt với Admin người thật
            this.updateOrderStatus(orderId, "admin", "DELIVERED", "Auto-verified by Cloudinary AI");

            // Cập nhật thêm trạng thái xác minh ở bảng Order (nếu cần)
            order.setVerifyStatus("VERIFIED_SUCCESS");
            orderRepository.save(order);
        } else {
            // Nếu AI nghi ngờ, có thể đổi verifyStatus sang WARNING để Admin kiểm tra tay
            order.setVerifyStatus("AI_WARNING");
            orderRepository.save(order);
        }
    }

    @Override
    @Scheduled(fixedRate = 60000) // 1 phút quét hệ thống 1 lần
    @Transactional
    public void autoConfirmOrders() {
        // 1. Lấy mốc thời gian: những đơn tạo cách đây hơn 5 phút
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);

        // 2. Tìm tất cả các đơn hàng đang ở trạng thái PENDING và đã quá thời gian chờ
        List<Order> pendingOrders = orderRepository.findByOrderStatusAndCreatedAtBefore(
                Order.OrderStatus.PENDING, threshold);

        for (Order order : pendingOrders) {
            String pStatus = order.getPaymentStatus();

            // TRƯỜNG HỢP 1: DUYỆT ĐƠN (Chuyển sang SHIPPING)
            // Nếu là COD (luôn là PENDING) hoặc các phương thức khác đã trả tiền xong (PAID)
            if (order.getPaymentMethod() == Order.PaymentMethod.COD || "PAID".equalsIgnoreCase(pStatus)) {
                this.updateOrderStatus(
                        order.getId(),
                        "admin",
                        "CONFIRMED",
                        "Order status will automatically change to CONFIRM after 5 minutes."
                );
            } // TRƯỜNG HỢP 2: HỦY ĐƠN (Chuyển sang CANCELLED)
            // Nếu trạng thái thanh toán KHÔNG PHẢI là PAID và cũng KHÔNG PHẢI là PENDING
            // Cách này sẽ chặn được tất cả các giá trị như "FAILED", "EXPIRED", "CANCELLED_PAYMENT"...
            else if (!"PENDING".equalsIgnoreCase(pStatus) && !"PAID".equalsIgnoreCase(pStatus)) {
                this.updateOrderStatus(
                        order.getId(),
                        "admin",
                        "CANCELLED",
                        "Auto-cancelled: Payment failure." + pStatus
                );
            }
        }
    }

    @Override
    public Order getOrderById(Integer orderId) {
        // Thêm dòng log này để Ngọc kiểm tra trong Console xem hàm có chạy không
        System.out.println("--- Đang truy xuất chi tiết đơn hàng ID: " + orderId + " ---");

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng mã: " + orderId));
    }

    // Logic gợi ý cho Backend xử lý khi Ship Failed -> Cancelled
    @Override
    public void handleShipFailedToCancelled(Integer orderId, String reason) {
        Order order = orderRepository.findById(orderId).orElseThrow();

        // 1. Cập nhật trạng thái đơn hàng
        order.setOrderStatus(Order.OrderStatus.CANCELLED);

        List<OrderItem> items = orderItemRepository.findByOrder_Id(orderId);
        // 2. Hoàn lại số lượng vào kho (Stock)
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        // 3. Hoàn lại Coupon nếu có
        if (order.getCoupon() != null) {
            Coupon coupon = order.getCoupon();
            coupon.setUsedCount(coupon.getUsedCount() - 1);
            couponRepository.save(coupon);
            // Có thể cần xóa bản ghi trong bảng UserCouponUsage nếu Ngọc có lưu
        }

        orderRepository.save(order);

        // Lưu vào lịch sử xử lý với lý do thất bại
        OrderManagement history = new OrderManagement();
        history.setOrder(order);
        history.setPreviousStatus("SHIPPING");
        history.setNewStatus("CANCELLED");
        history.setReason("Delivery Failed: " + reason);
        history.setCreatedAt(LocalDateTime.now());
        managementRepository.save(history);
    }

    @Override
    @Transactional
    public void refundPayPalOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // 1. Kiểm tra điều kiện hoàn tiền
        if (order.getPaymentMethod() != Order.PaymentMethod.PAYPAL) {
            throw new RuntimeException("This order was not paid via PayPal.");
        }
        if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new RuntimeException("Only PAID orders can be refunded.");
        }

        // 2. Lấy Capture ID từ Payment Logs (Cần ID này để PayPal biết hoàn cho giao dịch nào)
        PaymentLogManagement log = paymentLogRepository
                .findFirstByOrder_IdAndStatusOrderByCreatedAtDesc(orderId, "SUCCESS");

        if (log == null || log.getTransactionId() == null) {
            throw new RuntimeException("PayPal Transaction ID not found in logs.");
        }

        // 3. Gọi PayPal API để hoàn tiền
        boolean success = paypalService.refundOrder(log.getProvider(), order.getTotalPayPrice());

        if (success) {
            // 4. Cập nhật trạng thái và ghi log
            order.setPaymentStatus("REFUNDED");
            log.setStatus("REFUNDED");
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // 4. Ghi một dòng log chuyên biệt cho việc hoàn tiền vào Timeline
            OrderManagement history = new OrderManagement();
            history.setOrder(order);
            history.setPreviousStatus("CANCELLED");
            history.setNewStatus("CANCELLED"); // Trạng thái giữ nguyên nhưng lý do thay đổi
            history.setReason("PayPal Refund processed successfully by Admin.");
            history.setCreatedAt(LocalDateTime.now());
            managementRepository.save(history);
        } else {
            throw new RuntimeException("PayPal API rejected the refund request.");
        }
    }

    @Override
    public Page<Order> searchOrders(String searchText, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Truyền searchText vào cả ID và Tên để tìm kiếm linh hoạt
        return orderRepository.findBySearchText(searchText, pageable);
    }

    @Override
    public OrderStatsDTO getOrderStats() {
        // 1. Đếm tổng số đơn hàng
        long total = orderRepository.count();

        // 2. Đếm số đơn đang giao
        long shipping = orderRepository.countByOrderStatus(Order.OrderStatus.SHIPPING);

        // 3. Tính tổng doanh thu từ các đơn đã giao thành công (DELIVERED)
        Double revenue = orderRepository.sumTotalPayPriceByOrderStatus(Order.OrderStatus.DELIVERED);

        return new OrderStatsDTO(total, revenue != null ? revenue : 0.0, shipping);
    }

}
