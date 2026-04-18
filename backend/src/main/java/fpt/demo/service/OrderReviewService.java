package fpt.demo.service;

import fpt.demo.dto.CreateOrderReviewsDto;

public interface OrderReviewService {

    Object getOrderForReview(Integer orderId);

    Object submitOrderReviews(Integer orderId, CreateOrderReviewsDto dto);
}