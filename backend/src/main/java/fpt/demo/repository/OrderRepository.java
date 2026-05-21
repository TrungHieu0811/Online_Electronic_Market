package fpt.demo.repository;

import fpt.demo.entity.Order;
import fpt.demo.entity.User;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    // Lấy danh sách đơn hàng của một người dùng (mới nhất lên đầu)
    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Order> findByOrderStatus(Order.OrderStatus orderStatus, Pageable pageable);

    List<Order> findByOrderStatusAndCreatedAtBefore(Order.OrderStatus status, LocalDateTime dateTime);

    // 4. Tìm kiếm đơn hàng theo ID hoặc Tên người nhận (Dùng cho thanh Search của Admin)
    @Query("SELECT o FROM Order o WHERE "
            + "CAST(o.id AS string) LIKE %:searchText% OR "
            + "LOWER(o.shippingName) LIKE LOWER(CONCAT('%', :searchText, '%'))")
    Page<Order> findBySearchText(@Param("searchText") String searchText, Pageable pageable);

    long countByOrderStatus(Order.OrderStatus orderStatus);

// 2. Hàm tính tổng doanh thu (chỉ tính những đơn DELIVERED)
    @Query("SELECT SUM(o.totalPayPrice) FROM Order o WHERE o.orderStatus = :status")
    Double sumTotalPayPriceByOrderStatus(@Param("status") Order.OrderStatus status);
}
