package fpt.demo.repository;

import fpt.demo.entity.UserManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserManagementRepository extends JpaRepository<UserManagement, Integer> {
    // Tạm thời chỉ cần các hàm CRUD mặc định để lưu log
}