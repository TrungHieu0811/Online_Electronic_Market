package fpt.demo.service;

import fpt.demo.dto.OrderRequest;
import java.util.List;
import fpt.demo.entity.Cart;
import fpt.demo.entity.CartItem;
import fpt.demo.entity.Coupon;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.OrderManagement;
import fpt.demo.entity.Product;
import fpt.demo.entity.User;
import fpt.demo.repository.CartItemRepository;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.OrderManagementRepository;
import fpt.demo.repository.OrderRepository;
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
            for (CartItem item : items) {
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

            Order savedOrder = orderRepository.save(order);

            // BỔ SUNG: Ghi lịch sử quản lý đơn hàng ngay khi tạo mới
            OrderManagement history = new OrderManagement();
            history.setOrder(savedOrder);
            history.setActionType(OrderManagement.ActionType.PENDING);
            history.setReason("Đơn hàng được tạo thành công bởi: " + username);
            history.setCreatedAt(LocalDateTime.now());
            orderManagementRepository.save(history);

            // 7. Lưu OrderItems
            for (CartItem cartItem : items) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setProduct(cartItem.getProduct());
                orderItem.setQuantity(cartItem.getQuantity());
                orderItem.setPriceAtPurchase(cartItem.getProduct().getSalePrice());
                orderItem.setImportPriceAtPurchase(cartItem.getProduct().getImportPrice());
                orderItem.setTaxRateAtPurchase(0.1);
                orderItemRepository.save(orderItem);
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

            // 6. Lưu OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtPurchase(salePrice);
            orderItem.setImportPriceAtPurchase(importPrice);
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
            // 1. QUAN TRỌNG: Đổi USD sang VNĐ trước khi gọi API GHN
            double totalBaseVnd = totalBase * 25000.0;

            // 2. Truyền giá trị VNĐ vào service
            double ghnFeeVnd = shippingService.getShippingFee(districtId, wardCode, totalBaseVnd);
            
            // Nếu Sandbox trả về phí quá thấp (dưới 1000đ), hãy gán một con số thực tế hơn
            if (ghnFeeVnd < 1000.0) {
                ghnFeeVnd = 35000.0; // Giả lập phí ship là 35,000đ
            }

            // 3. Quy đổi kết quả phí ship từ VNĐ ngược lại USD
            double feeInUsd = ghnFeeVnd / 25000.0;

            System.out.println("Phi ship VND: " + ghnFeeVnd + " -> USD: " + feeInUsd);
            return feeInUsd;

        } catch (Exception e) {
            return 2.0; // Phí mặc định 2$ nếu lỗi
        }
    }
}
