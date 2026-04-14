package fpt.demo.service;

import fpt.demo.entity.OrderItem;
import fpt.demo.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemRepository orderItemRepository;

    @Override
    public List<OrderItem> getItemsByOrderId(Integer orderId) {
        return orderItemRepository.findByOrder_Id(orderId);
    }
}