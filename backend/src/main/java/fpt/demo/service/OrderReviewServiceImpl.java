package fpt.demo.service;

import fpt.demo.dto.CreateOrderItemReviewDto;
import fpt.demo.dto.CreateOrderReviewsDto;
import fpt.demo.dto.OrderReviewItemDto;
import fpt.demo.dto.OrderReviewPageDto;
import fpt.demo.entity.Order;
import fpt.demo.entity.OrderItem;
import fpt.demo.entity.ProductReview;
import fpt.demo.repository.OrderItemRepository;
import fpt.demo.repository.ProductReviewRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderReviewServiceImpl implements OrderReviewService {

    private final OrderItemRepository orderItemRepository;
      private final ProductReviewRepository productReviewRepository;

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
            dto.setImage(null); // tạm thời để null trước

            items.add(dto);
        }

        OrderReviewPageDto pageDto = new OrderReviewPageDto();
        pageDto.setOrderId(order.getId());
        pageDto.setStatus(order.getOrderStatus().name());
        pageDto.setItems(items);

        return pageDto;
    }

    @Override
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
            review.setStatus(ProductReview.ReviewStatus.PENDING);
            review.setCreatedAt(LocalDateTime.now());

            productReviewRepository.save(review);
        }

        return "Submit reviews successfully";
    }
}