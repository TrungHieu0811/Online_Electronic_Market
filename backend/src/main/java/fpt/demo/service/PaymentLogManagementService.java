package fpt.demo.service;

import fpt.demo.entity.PaymentLogManagement;
import java.util.List;

public interface PaymentLogManagementService {
    // Ghi log giao dịch và cập nhật trạng thái đơn hàng
    PaymentLogManagement savePaymentLog(Integer orderId, String transId, Double amount, 
                                       String provider, String status, String jsonResponse);
    
    List<PaymentLogManagement> getLogsByOrder(Integer orderId);
}