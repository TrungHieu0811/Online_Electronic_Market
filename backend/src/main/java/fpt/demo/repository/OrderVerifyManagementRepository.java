package fpt.demo.repository;

import fpt.demo.entity.OrderManagement;
import fpt.demo.entity.OrderVerifyManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderVerifyManagementRepository extends JpaRepository<OrderVerifyManagement, Integer> {
    // Tìm toàn bộ lịch sử các lần gọi xác minh cho 1 đơn hàng
    List<OrderVerifyManagement> findByOrder_IdOrderByAttemptNumberDesc(Integer orderId);
    
    
}