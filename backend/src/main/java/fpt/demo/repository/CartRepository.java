package fpt.demo.repository;

import fpt.demo.entity.Cart;
import fpt.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {
    // Tìm giỏ hàng theo đối tượng User
    Optional<Cart> findByUser(User user);
    
    // Tìm giỏ hàng theo username (rất tiện khi dùng với Principal)
    Optional<Cart> findByUser_Username(String username);
}