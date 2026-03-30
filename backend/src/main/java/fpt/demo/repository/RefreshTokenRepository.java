package fpt.demo.repository;

import fpt.demo.entity.RefreshToken;
import fpt.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    
    Optional<RefreshToken> findByToken(String token);
    
    // Đổi tên cho rõ nghĩa: Chỉ xóa toàn bộ token của user này
    void deleteAllByUser(User user);
}