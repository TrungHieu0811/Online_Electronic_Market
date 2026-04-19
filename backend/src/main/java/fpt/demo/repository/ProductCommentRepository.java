package fpt.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import fpt.demo.entity.ProductComment;

public interface ProductCommentRepository extends JpaRepository<ProductComment, Integer> {

    List<ProductComment> findByProductId(Integer productId);

    List<ProductComment> findByProductIdAndParentIsNull(Integer productId);

    List<ProductComment> findByParentId(Integer parentId);

    List<ProductComment> findByProductIdOrderByCreatedAtDesc(Integer productId);

    long countByProductIdAndIsAdminReplyFalseAndIsReadByAdminFalseAndStatusTrue(Integer productId);

    @Query(value = """
                SELECT c.product.id
                FROM ProductComment c
                WHERE c.status = true
                  AND c.isAdminReply = false
                  AND c.product IS NOT NULL
                GROUP BY c.product.id
                ORDER BY MAX(c.createdAt) DESC
            """, countQuery = """
                SELECT COUNT(DISTINCT c.product.id)
                FROM ProductComment c
                WHERE c.status = true
                  AND c.isAdminReply = false
                  AND c.product IS NOT NULL
            """)
    Page<Integer> findProductIdsWithComments(Pageable pageable);

    @Modifying
    @Query("""
                UPDATE ProductComment c
                SET c.isReadByAdmin = true,
                    c.adminReadAt = :readAt
                WHERE c.product.id = :productId
                  AND c.isAdminReply = false
                  AND c.isReadByAdmin = false
                  AND c.status = true
            """)
    int markAllUserCommentsAsReadByProductId(
            @Param("productId") Integer productId,
            @Param("readAt") LocalDateTime readAt);

    @Query("""
        SELECT c
        FROM ProductComment c
        WHERE c.isAdminReply = true
          AND c.status = true
          AND c.parent IS NOT NULL
          AND c.parent.user.username = :username
        ORDER BY c.createdAt DESC
        """)
    List<ProductComment> findAdminRepliesForUser(@Param("username") String username);

    @Modifying
    @Query("""
        UPDATE ProductComment c
        SET c.isReadByUser = true,
            c.userReadAt = :readAt
        WHERE c.isAdminReply = true
          AND c.status = true
          AND c.parent IS NOT NULL
          AND c.parent.user.username = :username
          AND (c.isReadByUser = false OR c.isReadByUser IS NULL)
        """)
    int markAllAdminReplyNotificationsAsReadByUsername(
            @Param("username") String username,
            @Param("readAt") LocalDateTime readAt);
}
