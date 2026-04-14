package fpt.demo.service;

import fpt.demo.entity.OrderVerifyManagement;
import java.util.List;

public interface OrderVerifyManagementService {
    OrderVerifyManagement logVerifyAttempt(Integer orderId, String adminUsername, 
                                          String status, String note);
    List<OrderVerifyManagement> getVerifyHistory(Integer orderId);
}