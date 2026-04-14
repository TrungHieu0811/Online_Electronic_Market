package fpt.demo.repository;

import fpt.demo.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    // Lấy danh sách các món hàng thuộc về một đơn hàng cụ thể
    List<OrderItem> findByOrder_Id(Integer orderId);
}