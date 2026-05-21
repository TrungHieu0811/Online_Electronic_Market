package fpt.demo.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import fpt.demo.entity.User;

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

    @Query("""
    SELECT u FROM User u
    WHERE LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(CAST(u.userRole as string)) LIKE LOWER(CONCAT('%', :keyword, '%'))
""")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    long countByStatus(Boolean status);

    long countByCreatedAtAfter(LocalDateTime time);
    
    // 👉 Cách an toàn 100%: Dùng danh sách Role truyền từ ngoài vào
    @Query("""
    SELECT u FROM User u
    WHERE (
           LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    AND u.userRole IN :roles
    """)
    Page<User> searchUsersForAdmin(@Param("keyword") String keyword, @Param("roles") java.util.List<fpt.demo.entity.Role> roles, Pageable pageable);
}
