//package fpt.demo.service;
//
//import fpt.demo.dto.CreateOrderItemReviewDto;
//import fpt.demo.dto.CreateOrderReviewsDto;
//import fpt.demo.dto.OrderReviewItemDto;
//import fpt.demo.dto.OrderReviewPageDto;
//import fpt.demo.dto.ai.ReviewModerationRequest;
//import fpt.demo.dto.ai.ReviewModerationResponse;
//import fpt.demo.dto.ai.ReviewSentimentRequest;
//import fpt.demo.dto.ai.ReviewSentimentResponse;
//import fpt.demo.entity.Order;
//import fpt.demo.entity.OrderItem;
//import fpt.demo.entity.ProductImage;
//import fpt.demo.entity.ProductReview;
//import fpt.demo.repository.OrderItemRepository;
//import fpt.demo.repository.ProductImageRepository;
//import fpt.demo.repository.ProductReviewRepository;
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.List;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//@Service
//@RequiredArgsConstructor
//public class OrderReviewServiceImpl implements OrderReviewService {
//
//    private final OrderItemRepository orderItemRepository;
//    private final ProductReviewRepository productReviewRepository;
//    private final ProductImageRepository productImageRepository;
//    private final AiReviewService aiReviewService;
//
//    @Override
//    public OrderReviewPageDto getOrderForReview(Integer orderId) {
//        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(orderId);
//
//        if (orderItems.isEmpty()) {
//            throw new RuntimeException("Order not found or has no items");
//        }
//
//        Order order = orderItems.get(0).getOrder();
//
//        if (order.getOrderStatus() != Order.OrderStatus.DELIVERED) {
//            throw new RuntimeException("Order is not delivered yet");
//        }
//
//        List<OrderReviewItemDto> items = new ArrayList<>();
//
//        for (OrderItem item : orderItems) {
//            boolean reviewed = productReviewRepository.existsByOrderItemId(item.getId());
//
//            if (reviewed) {
//                continue;
//            }
//
//            OrderReviewItemDto dto = new OrderReviewItemDto();
//            dto.setId(item.getId());
//            dto.setProductId(item.getProduct().getId());
//            dto.setName(item.getProduct().getVariantName());
//            dto.setVariant(item.getProduct().getSummary());
//            List<ProductImage> imageList = productImageRepository.findAllByProductId(item.getProduct().getId());
//
//            if (!imageList.isEmpty()) {
//                String imageUrl = imageList.get(0).getImageUrl();
//                dto.setImage(imageUrl);
//            } else {
//                dto.setImage(null); // Hoặc set một ảnh mặc định nếu muốn
//            }
//
//            items.add(dto);
//        }
//
//        OrderReviewPageDto pageDto = new OrderReviewPageDto();
//        pageDto.setOrderId(order.getId());
//        pageDto.setStatus(order.getOrderStatus().name());
//        pageDto.setItems(items);
//
//        return pageDto;
//    }
//
//    @Override
//    public Object submitOrderReviews(Integer orderId, CreateOrderReviewsDto dto) {
//
//        for (CreateOrderItemReviewDto item : dto.getReviews()) {
//
//            OrderItem orderItem = orderItemRepository.findById(item.getOrderItemId())
//                    .orElseThrow(() -> new RuntimeException("OrderItem not found"));
//
//            if (!orderItem.getOrder().getId().equals(orderId)) {
//                throw new RuntimeException("OrderItem does not belong to this order");
//            }
//
//            if (orderItem.getOrder().getOrderStatus() != Order.OrderStatus.DELIVERED) {
//                throw new RuntimeException("Order is not delivered yet");
//            }
//
//            if (productReviewRepository.existsByOrderItemId(item.getOrderItemId())) {
//                throw new RuntimeException("This item has already been reviewed");
//            }
//
//            ProductReview review = new ProductReview();
//            review.setProduct(orderItem.getProduct());
//            review.setOrder(orderItem.getOrder());
//            review.setOrderItem(orderItem);
//            review.setUser(orderItem.getOrder().getUser());
//            review.setRatingScore(item.getRating());
//            review.setComment(item.getComment());
//            review.setCreatedAt(LocalDateTime.now());
//
//            if (item.getComment() != null && !item.getComment().isBlank()) {
//                ReviewSentimentRequest aiRequest = new ReviewSentimentRequest();
//                aiRequest.setContent(item.getComment());
//                aiRequest.setRating(item.getRating());
//                aiRequest.setProductId(orderItem.getProduct().getId());
//                aiRequest.setUserId(orderItem.getOrder().getUser().getId());
//
//                ReviewSentimentResponse aiResult = aiReviewService.analyzeSentiment(aiRequest);
//
//                review.setSentiment(aiResult.getSentiment());
//                review.setSentimentExplanation(aiResult.getExplanation());
//
//                try {
//                    ReviewModerationRequest modRequest = new ReviewModerationRequest();
//                    modRequest.setContent(item.getComment());
//                    modRequest.setRating(item.getRating());
//                    modRequest.setProductId(orderItem.getProduct().getId());
//                    modRequest.setUserId(orderItem.getOrder().getUser().getId());
//
//                    ReviewModerationResponse modResult = aiReviewService.moderateReview(modRequest);
//
//                    if ("REJECTED".equalsIgnoreCase(modResult.getDecision())) {
//                        review.setStatus(ProductReview.ReviewStatus.REJECTED);
//                    } else {
//                        review.setStatus(ProductReview.ReviewStatus.APPROVED);
//                    }
//                } catch (Exception e) {
//                    review.setStatus(ProductReview.ReviewStatus.PENDING);
//                }
//
//            } else {
//                review.setSentiment(null);
//                review.setSentimentExplanation(null);
//                review.setStatus(ProductReview.ReviewStatus.APPROVED);
//            }
//
//            productReviewRepository.save(review);
//        }
//
//        return "Submit reviews successfully";
//    }
//}
package fpt.demo.service;

import fpt.demo.dto.CreateOrderItemReviewDto;
import fpt.demo.dto.CreateOrderReviewsDto;
import fpt.demo.dto.OrderReviewItemDto;
import fpt.demo.dto.OrderReviewPageDto;
import fpt.demo.dto.ai.ReviewModerationRequest;
import fpt.demo.dto.ai.ReviewModerationResponse;
import fpt.demo.dto.ai.ReviewSentimentRequest;
import fpt.demo.dto.ai.ReviewSentimentResponse;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductImage;
import fpt.demo.entity.ProductReview;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.ProductImageRepository;
import fpt.demo.repository.ProductReviewRepository;
import fpt.demo.repository.ProductRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderReviewServiceImpl implements OrderReviewService {

    private final OrderItemRepository orderItemRepository;
    private final ProductReviewRepository productReviewRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final AiReviewService aiReviewService;

    @Override
    public OrderReviewPageDto getOrderForReview(Integer orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(orderId);

        if (orderItems.isEmpty()) {
            throw new RuntimeException("Order not found or has no items");
        }

        Order order = orderItems.get(0).getOrder();

        if (order.getOrderStatus() != Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Order is not delivered yet");
        }

        List<OrderReviewItemDto> items = new ArrayList<>();

        for (OrderItem item : orderItems) {
            boolean reviewed = productReviewRepository.existsByOrderItemId(item.getId());

            if (reviewed) {
                continue;
            }

            OrderReviewItemDto dto = new OrderReviewItemDto();
            dto.setId(item.getId());
            dto.setProductId(item.getProduct().getId());
            dto.setName(item.getProduct().getVariantName());
            dto.setVariant(item.getProduct().getSummary());

            List<ProductImage> imageList = productImageRepository.findAllByProductId(item.getProduct().getId());

            if (!imageList.isEmpty()) {
                dto.setImage(imageList.get(0).getImageUrl());
            } else {
                dto.setImage(null);
            }

            items.add(dto);
        }

        OrderReviewPageDto pageDto = new OrderReviewPageDto();
        pageDto.setOrderId(order.getId());
        pageDto.setStatus(order.getOrderStatus().name());
        pageDto.setItems(items);

        return pageDto;
    }

    @Override
    @Transactional
    public Object submitOrderReviews(Integer orderId, CreateOrderReviewsDto dto) {

        for (CreateOrderItemReviewDto item : dto.getReviews()) {

            OrderItem orderItem = orderItemRepository.findById(item.getOrderItemId())
                    .orElseThrow(() -> new RuntimeException("OrderItem not found"));

            if (!orderItem.getOrder().getId().equals(orderId)) {
                throw new RuntimeException("OrderItem does not belong to this order");
            }

            if (orderItem.getOrder().getOrderStatus() != Order.OrderStatus.DELIVERED) {
                throw new RuntimeException("Order is not delivered yet");
            }

            if (productReviewRepository.existsByOrderItemId(item.getOrderItemId())) {
                throw new RuntimeException("This item has already been reviewed");
            }

            ProductReview review = new ProductReview();
            review.setProduct(orderItem.getProduct());
            review.setOrder(orderItem.getOrder());
            review.setOrderItem(orderItem);
            review.setUser(orderItem.getOrder().getUser());
            review.setRatingScore(item.getRating());
            review.setComment(item.getComment());
            review.setCreatedAt(LocalDateTime.now());

            if (item.getComment() != null && !item.getComment().isBlank()) {
                ReviewSentimentRequest aiRequest = new ReviewSentimentRequest();
                aiRequest.setContent(item.getComment());
                aiRequest.setRating(item.getRating());
                aiRequest.setProductId(orderItem.getProduct().getId());
                aiRequest.setUserId(orderItem.getOrder().getUser().getId());

                ReviewSentimentResponse aiResult = aiReviewService.analyzeSentiment(aiRequest);

                review.setSentiment(aiResult.getSentiment());
                review.setSentimentExplanation(aiResult.getExplanation());

                try {
                    ReviewModerationRequest modRequest = new ReviewModerationRequest();
                    modRequest.setContent(item.getComment());
                    modRequest.setRating(item.getRating());
                    modRequest.setProductId(orderItem.getProduct().getId());
                    modRequest.setUserId(orderItem.getOrder().getUser().getId());

                    ReviewModerationResponse modResult = aiReviewService.moderateReview(modRequest);

                    if ("REJECTED".equalsIgnoreCase(modResult.getDecision())) {
                        review.setStatus(ProductReview.ReviewStatus.REJECTED);
                    } else {
                        review.setStatus(ProductReview.ReviewStatus.APPROVED);
                    }
                } catch (Exception e) {
                    review.setStatus(ProductReview.ReviewStatus.PENDING);
                }

            } else {
                review.setSentiment(null);
                review.setSentimentExplanation(null);
                review.setStatus(ProductReview.ReviewStatus.APPROVED);
            }

            productReviewRepository.save(review);

            // cập nhật lại averageRating cho product
            Product product = orderItem.getProduct();
            Double avg = productReviewRepository.getAverageRating(product.getId());
            product.setAverageRating(avg != null ? avg : 0.0);
            productRepository.save(product);
        }

        return "Submit reviews successfully";
    }
}
