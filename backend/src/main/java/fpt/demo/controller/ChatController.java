package fpt.demo.controller;

import fpt.demo.service.GeminiService;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.OrderRepository;
import fpt.demo.repository.ProductAttributeRepository;
import fpt.demo.repository.ProductImageRepository;
import fpt.demo.repository.UserRepository;
import fpt.demo.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/chat") // Endpoint Public để Guest cũng chat được
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatController {

    private final GeminiService geminiService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final ProductImageRepository productImageRepository;
    private final ProductAttributeRepository productAttributeRepository;

    @PostMapping
    public String handleChat(@RequestBody Map<String, String> request, Principal principal) {
        String userMsg = request.get("message");
        String userMsgLower = userMsg.toLowerCase();
        StringBuilder context = new StringBuilder();

        // 1. Logic lấy dữ liệu sản phẩm dựa trên nhu cầu khách
        List<fpt.demo.entity.Product> productsToAi;

        // Nếu khách chào hỏi hoặc hỏi sản phẩm mới
        if (userMsgLower.matches(".*(hi|hello|chào|mới nhất|newest|mới).*")) {
            productsToAi = productRepository.findTop10ByOrderByCreatedAtDesc();
        } else {
            // Tách từ khóa đơn giản để tìm kiếm (Ví dụ: "iphone 15" hoặc "laptop asus")

            String cleanedMsg = userMsgLower
                    .replaceAll("(?i)so sánh|tìm|mua|giùm|hộ|với|và|giữa", " ")
                    .trim();

            // 2. Tách các cụm từ (ví dụ tách theo khoảng trắng hoặc dấu phẩy)
            String[] parts = cleanedMsg.split("\\s{2,}|,");

            // 3. Tìm kiếm từng phần và gộp kết quả
            List<fpt.demo.entity.Product> allFound = new ArrayList<>();
            for (String part : parts) {
                if (part.trim().length() > 2) {
                    List<fpt.demo.entity.Product> match = productRepository
                            .findByVariantName(part.trim(), PageRequest.of(0, 10))
                            .getContent();
                    allFound.addAll(match);
                }
            }
            productsToAi = allFound.stream().distinct().collect(Collectors.toList());
        }

        context.append("\nIMPORTANT for Tables: When creating a comparison table, in the 'Product Name' column, ");
        context.append("you MUST use the format: slug|display_name. Example: | iphone-15-pro|iPhone 15 Pro | ... |");

// Đảm bảo dữ liệu sản phẩm gửi sang AI có 4 thành phần đầu tiên đúng chuẩn
// --- THAY THẾ ĐOẠN NÀY ---
        if (productsToAi.isEmpty()) {
            context.append("DATABASE_STATUS: NO_PRODUCTS_FOUND. ");
        } else {
            String productsData = productsToAi.stream()
                    .map(p -> {
                        // 1. Lấy ảnh thumbnail chuẩn
                        String thumbnail = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(p.getId())
                                .map(img -> img.getImageUrl()).orElse("no image");

                        // 2. LẤY NỘI DUNG THUỘC TÍNH (Sửa tại đây để hiện thị nội dung thay vì ID)
                        String attrs = productAttributeRepository.findAllByProductId(p.getId()).stream()
                                .map(a -> a.getName() + ": " + a.getAttrValue()) // VD: RAM: 8GB
                                .collect(Collectors.joining(", "));

                        // 3. Format theo chuẩn GeminiService yêu cầu
                        return String.format("[ID:%s|%s|%s|%.1f$|%s|%s]",
                                p.getSlug(),
                                thumbnail,
                                p.getVariantName(),
                                p.getSalePrice(),
                                p.getSummary().replace("|", " "),
                                attrs.replace("|", " "));
                    })
                    .collect(Collectors.joining("; "));

            context.append("ElectroMart_Internal_DB: ").append(productsData).append(". ");
        }

        // 3. Thông tin bổ trợ (Chỉ nạp, AI sẽ tự quyết định có dùng hay không dựa trên instruction mới)
        if (principal != null) {
            userRepository.findByUsername(principal.getName()).ifPresent(user -> {
                context.append("User Name: ").append(user.getFullName()).append(". ");
                var orders = orderRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 1));
                if (!orders.isEmpty()) {
                    context.append("Latest Order Status: ").append(orders.getContent().get(0).getOrderStatus()).append(". ");
                }
            });
        } else {
            context.append("User is a Guest. Do not mention personal order history. ");
        }

        String coupons = couponService.getAllCoupons().stream()
                .filter(c -> fpt.demo.entity.Coupon.CouponStatus.ACTIVE.equals(c.getStatus()))
                .limit(4)
                .map(c -> {
                    if ("FIXED_AMOUNT".equals(c.getDiscountType())) {
                        return String.format("%s (Giảm %.0f$ cho đơn từ %.0f$)",
                                c.getCode(), c.getDiscountValue(), c.getMinOrderValue());
                    } else {
                        return String.format("%s (Giảm %.0f%% cho đơn từ %.0f$)",
                                c.getCode(), c.getDiscountValue(), c.getMinOrderValue());
                    }
                })
                .collect(Collectors.joining("; "));
        context.append("Active Coupons: ").append(coupons).append(". ");

        return geminiService.getChatResponse(userMsg, context.toString());
    }
}
