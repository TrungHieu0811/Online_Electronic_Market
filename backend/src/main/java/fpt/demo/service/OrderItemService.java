package fpt.demo.service;

import fpt.demo.entity.OrderItem;
import java.util.List;

public interface OrderItemService {
    List<OrderItem> getItemsByOrderId(Integer orderId);
}