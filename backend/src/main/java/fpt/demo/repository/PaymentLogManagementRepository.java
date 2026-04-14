package fpt.demo.repository;

import fpt.demo.entity.PaymentLogManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentLogManagementRepository extends JpaRepository<PaymentLogManagement, Integer> {
    // Tìm lịch sử thanh toán của một đơn hàng
    List<PaymentLogManagement> findByOrder_IdOrderByCreatedAtDesc(Integer orderId);
    
    // Tìm theo mã giao dịch của đối tác (để tránh xử lý trùng lặp - Idempotency)
    Optional<PaymentLogManagement> findByTransactionId(String transactionId);
}