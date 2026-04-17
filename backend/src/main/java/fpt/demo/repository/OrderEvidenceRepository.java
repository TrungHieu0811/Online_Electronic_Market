package fpt.demo.repository;

import fpt.demo.entity.OrderEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderEvidenceRepository extends JpaRepository<OrderEvidence, Integer> {
    List<OrderEvidence> findByOrder_Id(Integer orderId);
}