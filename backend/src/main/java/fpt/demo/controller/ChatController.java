package fpt.demo.controller;

import fpt.demo.service.GeminiService;
import fpt.demo.repository.*;
import fpt.demo.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/chat")
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

        List<fpt.demo.entity.Product> productsForAi = new ArrayList<>();

        
        String baseKeyword = userMsgLower
                .replaceAll("(?i)tìm|kiếm|mua|hộ|giùm|search|find|get|buy|show|cần|lấy|cho|về", "")
                
                .replaceAll("(?i)so sánh|đối chiếu|giữa|với|and|compare|vs|between|review|đánh giá|nhận xét|opinion", "")
                
                .replaceAll("(?i)giá|price|cost|dưới|trên|khoảng|tầm|đô|rẻ|đắt|bao nhiêu|under|below|above|over|around|cheap|expensive|how much", "")
                
                .replaceAll("\\d+\\s*\\$|\\d+", "")
                .trim();

        
        if (userMsgLower.matches(".*(hi|hello|chào).*") && userMsgLower.length() < 10) {
            productsForAi = productRepository.findTop10ByOrderByCreatedAtDesc();
        } 
        else if (userMsgLower.matches(".*(so sánh|compare|vs|đối chiếu).*")) {
            
            String[] names = baseKeyword.split("(?i)\\s+và\\s+|\\s+với\\s+|\\s+giữa\\s+|\\s+vs\\s+|\\s+and\\s+|,");
            for (String n : names) {
                String cleanName = n.replaceAll("\\d+\\$|\\d+", "").trim(); 
                if (cleanName.length() > 1) {
                    productsForAi.addAll(productRepository.findByVariantName(cleanName, PageRequest.of(0, 15)).getContent());
                }
            }
        } 
        else if (userMsgLower.matches(".*(review|đánh giá|view|hot|top|phổ biến).*")) {
            if (baseKeyword.length() > 2) {
                productsForAi.addAll(productRepository.findByVariantName(baseKeyword, PageRequest.of(0, 20)).getContent());
            } else {
                productsForAi.addAll(productRepository.findTopMostViewedProducts(PageRequest.of(0, 10)));
            }
        } 
        else if (baseKeyword.length() > 1) {
            // Lấy context rộng (40 sản phẩm) để AI tự thực hiện các logic lọc phức tạp (giá, màu...)
            productsForAi.addAll(productRepository.findByVariantName(baseKeyword, PageRequest.of(0, 70)).getContent());
        }

        // FALLBACK: Nếu không khớp trường hợp nào hoặc kết quả trống
        if (productsForAi.isEmpty()) {
            productsForAi.addAll(productRepository.findAll(PageRequest.of(0, 15)).getContent());
        }

        // --- 2. XỬ LÝ DỮ LIỆU SẢN PHẨM & CHUẨN HÓA HÌNH ẢNH ---
        List<fpt.demo.entity.Product> activeProducts = productsForAi.stream()
                .distinct()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus())) // Chặn sản phẩm Inactive tại đây
                .collect(Collectors.toList());

        if (activeProducts.isEmpty()) {
            context.append("DATABASE_STATUS: NO_PRODUCTS_FOUND. ");
        } else {
            String productsData = activeProducts.parallelStream().map(p -> {

                // Lấy ảnh và chuẩn hóa đường dẫn để Web/Mobile hiển thị được ngay
                String thumbnail = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(p.getId())
                        .map(img -> {
                            String raw = img.getImageUrl();
                            if (raw == null || raw.equals("no image") || raw.startsWith("http")) {
                                return raw;
                            }
                            // Xóa dấu / ở đầu nếu có (ví dụ: "/products/hinh.webp" -> "products/hinh.webp")
                            return raw.startsWith("/") ? raw.substring(1) : raw;
                        }).orElse("no image");

                String attrs = productAttributeRepository.findAllByProductId(p.getId()).stream()
                        .map(a -> a.getName() + ": " + a.getAttrValue())
                        .collect(Collectors.joining(", "));

                String desc = p.getDescription() != null ? p.getDescription().replace("|", " ") : "No desc";
                if (desc.length() > 300) {
                    desc = desc.substring(0, 300) + "...";
                }

                return String.format("[ID:%s|%s|%s|Base:%.1f$|Sale:%.1f$|Rating:%.1f|Views:%d|Desc:%s|Attrs:%s]",
                        p.getSlug(), thumbnail, p.getVariantName(), p.getBasePrice(), p.getSalePrice(),
                        p.getAverageRating(), p.getViewCount(), desc, attrs.replace("|", " "));
            }).collect(Collectors.joining("; "));

            context.append("ElectroMart_DB: ").append(productsData).append(". ");
        }

        // --- 3. DỮ LIỆU CÁ NHÂN & COUPON (GIỮ NGUYÊN) ---
        if (principal != null) {
            userRepository.findByUsername(principal.getName()).ifPresent(user -> {
                context.append("User:").append(user.getFullName()).append(". ");
                var orders = orderRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 5)).getContent();
                if (!orders.isEmpty()) {
                    String oCtx = orders.stream().map(o -> String.format("ID:%d|St:%s|Total:%.1f$", o.getId(), o.getOrderStatus(), o.getTotalPayPrice()))
                            .collect(Collectors.joining("; "));
                    context.append("Orders:").append(oCtx).append(". ");
                }
            });
        }

        String coupons = couponService.getAllCoupons().stream()
                .filter(c -> fpt.demo.entity.Coupon.CouponStatus.ACTIVE.equals(c.getStatus()))
                .limit(5)
                .map(c -> String.format("%s:-%s%s", c.getCode(), c.getDiscountValue(), ("FIXED_AMOUNT".equals(c.getDiscountType()) ? "$" : "%")))
                .collect(Collectors.joining("; "));
        context.append("Coupons:").append(coupons).append(". ");

        return geminiService.getChatResponse(userMsg, context.toString());
    }
}
