package fpt.demo.repository;

import fpt.demo.entity.OrderItem;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrder_Id(Integer orderId);

    @Query("""
        SELECT COALESCE(SUM(oi.quantity), 0)
        FROM OrderItem oi
        WHERE oi.product.id = :productId
          AND oi.order.orderStatus = fpt.demo.entity.Order$OrderStatus.DELIVERED
          AND oi.order.createdAt >= :fromDate
    """)
    Integer getTotalSoldByProductSince(
            @Param("productId") Integer productId,
            @Param("fromDate") LocalDateTime fromDate
    );
}