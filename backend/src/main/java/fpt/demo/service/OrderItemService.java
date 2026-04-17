package fpt.demo.service;

import java.util.List;

import fpt.demo.entity.OrderItem;

public interface OrderItemService {
    List<OrderItem> getItemsByOrderId(Integer orderId);
}