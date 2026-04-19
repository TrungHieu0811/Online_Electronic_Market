package fpt.demo.service;

import fpt.demo.dto.OrderRequest;
import java.util.List;
import fpt.demo.entity.Cart;
import fpt.demo.entity.CartItem;
import fpt.demo.entity.Coupon;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.OrderManagement;
import fpt.demo.entity.PaymentLogManagement;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductImage;
import fpt.demo.entity.User;
import fpt.demo.repository.CartItemRepository;
import fpt.demo.repository.CouponRepository;
import fpt.demo.repository.CouponUsageRepository;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.OrderManagementRepository;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.PaymentLogManagementRepository;
import fpt.demo.repository.ProductImageRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderManagementRepository orderManagementRepository;
    private final CartItemRepository cartItemRepository;
    private final CartService cartService;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final CouponUsageService couponUsageService;
    private final ProductRepository productRepository;
    private final ShippingService shippingService;
    private final PayPalService paypalService;
    private final PaymentLogManagementRepository paymentLogRepository;
    private final CouponRepository couponRepository; // Thêm mới
    private final CouponUsageRepository couponUsageRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    @Transactional
    public Order createOrder(String username, OrderRequest request) {
        try {
            // 1. Lấy thông tin User
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found."));

            // 2. Lấy giỏ hàng
            Cart cart = cartService.getOrCreateCart(username);
            List<CartItem> items = cartItemRepository.findByCart_Id(cart.getId());
            if (items.isEmpty()) {
                throw new RuntimeException("Cart is empty!");
            }

            // 3. Xử lý thông tin giao hàng (SỬA LỖI: Check Null an toàn hơn)
            String finalName = (request.getShipName() == null || request.getShipName().trim().isEmpty())
                    ? (user.getFullName() != null ? user.getFullName() : user.getUsername())
                    : request.getShipName();

            String finalPhone = (request.getShipPhone() == null || request.getShipPhone().trim().isEmpty())
                    ? user.getPhone()
                    : request.getShipPhone();

            String finalAddress = (request.getShipAddress() == null || request.getShipAddress().trim().isEmpty())
                    ? user.getAddress()
                    : request.getShipAddress();

            if (finalAddress == null || finalAddress.trim().isEmpty()) {
                throw new RuntimeException("Please enter your shipping address.");
            }

            // 4. Tính toán tài chính (SỬA LỖI: Check giá sản phẩm tránh Null)
            double totalBase = 0;
            double totalImport = 0;
            int totalItems = 0;
            for (CartItem item : items) {
                Product product = item.getProduct();
                totalItems += item.getQuantity();
                // KIỂM TRA TỒN KHO [Bổ sung]
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Sản phẩm " + product.getVariantName() + " không đủ hàng tồn kho!");
                }
                Double salePrice = item.getProduct().getSalePrice();
                Double importPrice = item.getProduct().getImportPrice();

                if (salePrice == null || importPrice == null) {
                    throw new RuntimeException("Product " + item.getProduct().getVariantName() + " is missing price information!");
                }

                totalBase += salePrice * item.getQuantity();
                totalImport += importPrice * item.getQuantity();
            }

            double shippingFee = calculateFinalShippingFee(request.getDistrictId(), request.getWardCode(), totalBase);

            // 5. Logic Coupon
            double discount = 0;
            Coupon appliedCoupon = null;
            String code = request.getCouponCode(); // Lấy từ DTO

            if (code != null && !code.isBlank()) {
                if (couponService.isValid(code, totalBase)) {
                    appliedCoupon = couponService.getCouponByCode(code);

                    if (couponUsageService.hasReachedUserLimit(user.getId(), appliedCoupon)) {
                        throw new RuntimeException("Bạn đã hết lượt sử dụng mã giảm giá này!");
                    }

                    discount = appliedCoupon.getDiscountValue();
                    if (discount > totalBase) {
                        discount = totalBase;
                    }
                } else {
                    throw new RuntimeException("Mã giảm giá không hợp lệ hoặc không đủ điều kiện!");
                }
            }

            // 6. Lưu Đơn hàng 
            Order order = new Order();

            try {
                order.setPaymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod());
            }

            order.setUser(user);
            order.setShippingName(finalName);
            order.setShippingPhone(finalPhone);
            order.setShippingAddress(finalAddress);
            order.setShippingNote(request.getNote());
            order.setTotalImportPrice(totalImport);
            order.setShippingFee(shippingFee);
            order.setTotalBasePrice(totalBase);
            order.setTaxAmount(totalBase * 0.1);
            order.setDiscountAmount(discount);
            double finalPay = totalBase + (totalBase * 0.1) + shippingFee - discount;
            order.setTotalPayPrice(finalPay);
            order.setCreatedAt(LocalDateTime.now());

            order.setTotalQuantity(totalItems);
            Order savedOrder = orderRepository.save(order);

            // BỔ SUNG: Ghi lịch sử quản lý đơn hàng ngay khi tạo mới
            OrderManagement history = new OrderManagement();
            history.setOrder(savedOrder);
            history.setActionType(OrderManagement.ActionType.PENDING);
            history.setReason("This order was successfully placed by: " + username);
            history.setCreatedAt(LocalDateTime.now());
            orderManagementRepository.save(history);

            // 7. Lưu OrderItems
            for (CartItem cartItem : items) {
                Product product = cartItem.getProduct();
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setProduct(cartItem.getProduct());
                orderItem.setQuantity(cartItem.getQuantity());
                orderItem.setPriceAtPurchase(cartItem.getProduct().getSalePrice());
                orderItem.setImportPriceAtPurchase(cartItem.getProduct().getImportPrice());
                orderItem.setTaxRateAtPurchase(0.1);
                orderItem.setImageUrl(cartItem.getImageUrl());
                orderItemRepository.save(orderItem);

                product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
                productRepository.save(product);
            }

            // 8. Xóa giỏ hàng & Ghi lịch sử Coupon
            cartItemRepository.deleteByCart_Id(cart.getId());

            if (appliedCoupon != null) {
                couponUsageService.recordUsage(user, appliedCoupon, savedOrder.getId());
                // Cập nhật số lượng (Nên dùng hàm riêng để đảm bảo persistence)
                appliedCoupon.setUsedCount(appliedCoupon.getUsedCount() + 1);
                // couponRepository.save(appliedCoupon); // Cần nếu appliedCoupon chưa được quản lý
            }

            return savedOrder;
        } catch (Exception e) {
            e.printStackTrace(); // Dòng này sẽ in chi tiết lỗi ra màn hình đen (Console)
            throw new RuntimeException("Lỗi chi tiết: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Order buyNow(String username, Integer productId, Integer quantity, OrderRequest request) {
        try {
            // 1. Lấy User và Product
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found."));
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found."));

            // 2. Kiểm tra tồn kho
            if (product.getStockQuantity() < quantity) {
                throw new RuntimeException("Insufficient stock! Available:" + product.getStockQuantity());
            }

            // 3. Xử lý thông tin giao hàng an toàn
            String finalName = (request.getShipName() != null && !request.getShipName().isBlank())
                    ? request.getShipName() : (user.getFullName() != null ? user.getFullName() : user.getUsername());
            String finalPhone = (request.getShipPhone() != null && !request.getShipPhone().isBlank())
                    ? request.getShipPhone() : user.getPhone();
            String finalAddress = (request.getShipAddress() != null && !request.getShipAddress().isBlank())
                    ? request.getShipAddress() : user.getAddress();

            if (finalAddress == null || finalAddress.isBlank()) {
                throw new RuntimeException("Please provide your delivery address.");
            }

            // 4. Tính toán tài chính
            double salePrice = product.getSalePrice() != null ? product.getSalePrice() : 0.0;
            double importPrice = product.getImportPrice() != null ? product.getImportPrice() : 0.0;
            double totalBase = salePrice * quantity;
            double tax = totalBase * 0.1;

            double shippingFee = calculateFinalShippingFee(request.getDistrictId(), request.getWardCode(), totalBase);

            // 5. Khởi tạo đơn hàng
            Order order = new Order();
            order.setUser(user);
            order.setShippingName(finalName);
            order.setShippingPhone(finalPhone);
            order.setShippingAddress(finalAddress);
            order.setShippingNote(request.getNote());
            order.setTotalBasePrice(totalBase);
            order.setTotalImportPrice(importPrice * quantity);
            order.setTaxAmount(tax);
            order.setDiscountAmount(0.0);
            order.setShippingFee(shippingFee);
            order.setTotalPayPrice(totalBase + tax + shippingFee);

            try {
                order.setPaymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid payment method: " + request.getPaymentMethod());
            }
            order.setCreatedAt(LocalDateTime.now());

            Order savedOrder = orderRepository.save(order);

            // BỔ SUNG: Ghi lịch sử quản lý đơn hàng ngay khi tạo mới
            OrderManagement history = new OrderManagement();
            history.setOrder(savedOrder);
            history.setActionType(OrderManagement.ActionType.PENDING);
            history.setReason("Đơn hàng được tạo thành công bởi: " + username);
            history.setCreatedAt(LocalDateTime.now());
            orderManagementRepository.save(history);

            List<ProductImage> imageList = productImageRepository.findAllByProductId(product.getId());
            String proThumbnail = null;
            if (imageList != null && !imageList.isEmpty()) {
                proThumbnail = imageList.get(0).getImageUrl();
            }

            // 6. Lưu OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtPurchase(salePrice);
            orderItem.setImportPriceAtPurchase(importPrice);
            orderItem.setImageUrl(proThumbnail);

            orderItemRepository.save(orderItem);

            // 7. Cập nhật tồn kho thực tế
            productRepository.decreaseStock(productId, quantity);

            return savedOrder;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage());
        }
    }

    @Override
    public Page<Order> getMyOrders(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Tạo đối tượng phân trang (page bắt đầu từ 0)
        Pageable pageable = PageRequest.of(page, size);

        return orderRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Override
    public Order getOrderDetail(Integer orderId) {
        // Triển khai nốt phương thức lấy chi tiết 1 đơn hàng
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng mã: " + orderId));
    }

    @Override
    public double previewShippingFee(Integer districtId, String wardCode, double totalAmount) {
        return calculateFinalShippingFee(districtId, wardCode, totalAmount);
    }

    /**
     * Tính toán phí vận chuyển cuối cùng sau khi áp dụng các chính sách khuyến
     * mãi.
     */
    private double calculateFinalShippingFee(Integer districtId, String wardCode, double totalBase) {
        // 1. CHÍNH SÁCH 1: Miễn phí vận chuyển cho đơn hàng giá trị cao (Trên 1500$)
        if (totalBase >= 1500.0) {
            System.out.println("FREE SHIPPING on orders over $1500.");
            return 0.0;
        }

        // 2. CHÍNH SÁCH 2: Miễn phí vận chuyển nội thành (Giả lập khoảng cách 5km bằng cùng Quận/Huyện)
        final Integer SHOP_DISTRICT_ID = 1452;

        if (districtId != null && districtId.equals(SHOP_DISTRICT_ID)) {
            System.out.println("Free shipping for local orders under 5km from our shop.)");
            return 0.0;
        }

        // 3. Lấy phí từ GHN nếu không thỏa mãn các điều kiện trên
        try {
            // LẤY CART TỪ USERNAME 
            // 1. Lấy thông tin User đang đăng nhập từ hệ thống Security của Spring
            String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();

            // 2. Tìm User trong Database để lấy ID
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Integer userId = user.getId();
            List<CartItem> items = cartItemRepository.findByCart_User_IdAndIsSelected(userId, true);

            int totalWeight = items.stream()
                    .mapToInt(item -> item.getQuantity() * 800)
                    .sum();

            if (totalWeight == 0) {
                totalWeight = 1000; // Mặc định 1kg nếu có lỗi tính toán
            }
            // 1. QUAN TRỌNG: Đổi USD sang VNĐ trước khi gọi API GHN
            double totalBaseVnd = totalBase * 25000.0;

            // 2. Truyền giá trị VNĐ vào service
            double ghnFeeVnd = shippingService.getShippingFee(districtId, wardCode, totalBaseVnd, totalWeight);

            // Nếu Sandbox trả về phí quá thấp (dưới 1000đ), hãy gán một con số thực tế hơn
//      if (ghnFeeVnd < 1000.0) {
//        ghnFeeVnd = 35000.0; // Giả lập phí ship là 35,000đ
//      }
            double adjustedFeeVnd = (ghnFeeVnd);

            // 3. Quy đổi kết quả phí ship từ VNĐ ngược lại USD
            double feeInUsd = adjustedFeeVnd / 25000.0;

            System.out.println("Tổng cân nặng đơn hàng: " + totalWeight + "g");
            System.out.println("Phi ship VND: " + ghnFeeVnd + " -> USD: " + feeInUsd);
            return feeInUsd;

        } catch (Exception e) {
            return 2.0; // Phí mặc định 2$ nếu lỗi
        }
    }

    @Override
    @Transactional(readOnly = true)
    public double getShippingDistance(Integer districtId, String wardCode) {
        try {
            // 1. Lấy User hiện tại để tìm giỏ hàng
            String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 2. Tính tổng cân nặng của các món hàng đang được chọn (giống hệt bên tính phí)
            List<CartItem> items = cartItemRepository.findByCart_User_IdAndIsSelected(user.getId(), true);
            int totalWeight = items.stream()
                    .mapToInt(item -> item.getQuantity() * 800)
                    .sum();

            if (totalWeight == 0) {
                totalWeight = 1000;
            }

            // 3. Gọi Service với đầy đủ 3 tham số (Sau khi bé đã sửa Interface và Impl)
            return shippingService.getActualDistance(districtId, wardCode, totalWeight);

        } catch (Exception e) {
            System.err.println("Lỗi tính khoảng cách: " + e.getMessage());
            return 0.0;
        }
    }

    @Override
    @Transactional
    public void cancelOrder(String username, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        // 1. Kiểm tra quyền sở hữu đơn hàng
        if (!order.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You do not have permission to cancel this order.");
        }

        // 2. Chỉ cho phép hủy khi đang ở trạng thái PENDING hoặc CONFIRMED
        if (order.getOrderStatus() != Order.OrderStatus.PENDING
                && order.getOrderStatus() != Order.OrderStatus.CONFIRMED) {
            throw new RuntimeException("Order status: " + order.getOrderStatus() + " unable to cancel.");
        }

        // 3. Xử lý hoàn tiền PayPal (giữ nguyên logic cũ của bạn)
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())
                && order.getPaymentMethod() == Order.PaymentMethod.PAYPAL) {
            PaymentLogManagement paymentLog = paymentLogRepository
                    .findFirstByOrder_IdAndStatusOrderByCreatedAtDesc(orderId, "SUCCESS");

            if (paymentLog != null && paymentLog.getProvider() != null) {
                boolean refundSuccess = paypalService.refundOrder(paymentLog.getProvider(), order.getTotalPayPrice());
                if (!refundSuccess) {
                    throw new RuntimeException("Unable to process PayPal refund. Please reach out to support.");
                }
                order.setPaymentStatus("REFUNDED");
            } else {
                throw new RuntimeException("PayPal transaction not found.");
            }
        }

        // 4. Hoàn trả số lượng tồn kho cho sản phẩm (giữ nguyên)
        List<OrderItem> items = orderItemRepository.findByOrder_Id(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        // --- BỔ SUNG: LOGIC HOÀN TRẢ COUPON ---
        // Tìm xem đơn hàng này có sử dụng Coupon không thông qua bảng CouponUsage
        couponUsageRepository.findByOrderId(orderId).ifPresent(usage -> {
            Coupon coupon = usage.getCoupon();
            if (coupon != null) {
                // 1. Hoàn trả số lượng mã đã sử dụng toàn hệ thống
                // Giảm usedCount đi 1, đảm bảo không nhỏ hơn 0
                coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                couponRepository.save(coupon);

                // 2. Xóa bản ghi lịch sử sử dụng mã của User này
                // Việc xóa này giúp User có thể nhập lại mã này cho đơn hàng sau (nếu mã giới hạn lượt dùng/người)
                couponUsageRepository.delete(usage);
            }
        });
        // --------------------------------------

        // 5. Cập nhật trạng thái đơn hàng sang CANCELLED
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 6. Ghi log lịch sử quản lý
        OrderManagement log = new OrderManagement();
        log.setOrder(order);
        log.setActionType(OrderManagement.ActionType.CANCELLED);
        log.setReason("Cancelled by user. Coupon and stock restored.");
        log.setCreatedAt(LocalDateTime.now());
        orderManagementRepository.save(log);
    }

    // Trong OrderServiceImpl.java
    @Override
    @Transactional
    public void cancelOrderInternal(Integer orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        // 1. HOÀN TRẢ TỒN KHO CHO SẢN PHẨM
        List<OrderItem> items = orderItemRepository.findByOrder_Id(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product != null) {
                // Cộng lại số lượng khách đã đặt vào kho thực tế
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        // 2. HOÀN TRẢ LƯỢT DÙNG COUPON
        couponUsageRepository.findByOrderId(orderId).ifPresent(usage -> {
            Coupon coupon = usage.getCoupon();
            if (coupon != null) {
                coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                couponRepository.save(coupon);
                couponUsageRepository.delete(usage);
            }
        });

        // 3. CẬP NHẬT TRẠNG THÁI ĐƠN VÀ THANH TOÁN
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setPaymentStatus("FAILED");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 4. GHI LOG HỆ THỐNG
        OrderManagement log = new OrderManagement();
        log.setOrder(order);
        log.setActionType(OrderManagement.ActionType.CANCELLED);
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());
        orderManagementRepository.save(log);
    }
}
