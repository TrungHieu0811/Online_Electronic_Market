package fpt.demo.service;

import java.util.List;

import fpt.demo.entity.OrderVerifyManagement;

public interface OrderVerifyManagementService {
    OrderVerifyManagement logVerifyAttempt(Integer orderId, String adminUsername,
            String status, String note);

    List<OrderVerifyManagement> getVerifyHistory(Integer orderId);
}