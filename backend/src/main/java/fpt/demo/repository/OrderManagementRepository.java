package fpt.demo.repository;

import fpt.demo.entity.OrderManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface OrderManagementRepository extends JpaRepository<OrderManagement, Integer> {

    // Lấy lịch sử thay đổi của một đơn hàng (mới nhất lên đầu)
    List<OrderManagement> findByOrder_IdOrderByCreatedAtDesc(Integer orderId);

    List<OrderManagement> findByActionTypeOrderByCreatedAtDesc(String actionType);
}
