package fpt.demo.repository;

import fpt.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // Tìm user theo username (dùng khi đăng nhập)
    Optional<User> findByUsername(String username);
    
    // Tìm user theo email
    Optional<User> findByEmail(String email);
    
    // Kiểm tra xem username hoặc email đã tồn tại chưa (dùng khi đăng ký)
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    // THÊM DÒNG NÀY ĐỂ KIỂM TRA TRÙNG SỐ ĐIỆN THOẠI
    boolean existsByPhone(String phone);
}