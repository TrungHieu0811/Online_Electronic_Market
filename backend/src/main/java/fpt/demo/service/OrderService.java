package fpt.demo.service;

import fpt.demo.dto.OrderRequest;
import fpt.demo.entity.Order;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;

public interface OrderService {

    Order createOrder(String username, OrderRequest request);

    Page<Order> getMyOrders(String username, int page, int size);

    Order getOrderDetail(Integer orderId);

    Order buyNow(String username, Integer productId, Integer quantity, OrderRequest request);

     double previewShippingFee(Integer districtId, String wardCode, double totalAmount);
    
    void cancelOrder(String username, Integer orderId);
    
    void cancelOrderInternal(Integer orderId, String reason);
    
    double getShippingDistance(Integer districtId, String wardCode);
}
