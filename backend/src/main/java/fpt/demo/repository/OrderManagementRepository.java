package fpt.demo.repository;

import fpt.demo.entity.Order;
import fpt.demo.entity.OrderManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface OrderManagementRepository extends JpaRepository<OrderManagement, Integer> {

    // Lấy lịch sử thay đổi của một đơn hàng (mới nhất lên đầu)
    List<OrderManagement> findByOrder_IdOrderByCreatedAtDesc(Integer orderId);

    List<OrderManagement> findByActionTypeOrderByCreatedAtDesc(String actionType);

    // 2. Tìm tất cả đơn hàng kèm phân trang (Dùng cho trang Admin tổng quát)
//    Page<OrderManagement> findAll(Pageable pageable);
    // 3. Lọc đơn hàng theo Trạng thái (Dùng cho các tab: Chờ duyệt, Đã hủy, v.v. ở Admin)
    // Trong OrderRepository.java

//    Page<Order> findByOrderStatus(Order.OrderStatus orderStatus, Pageable pageable);

    
}
