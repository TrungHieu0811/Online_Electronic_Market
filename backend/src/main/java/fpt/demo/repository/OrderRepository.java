package fpt.demo.repository;

import fpt.demo.entity.Order;
import fpt.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // Lấy danh sách đơn hàng của một người dùng (mới nhất lên đầu)
    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}