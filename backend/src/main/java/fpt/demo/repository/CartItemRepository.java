package fpt.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import fpt.demo.entity.Cart;
import fpt.demo.entity.CartItem;
import fpt.demo.entity.Product;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    // Tìm xem sản phẩm này đã có trong giỏ chưa
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);

    // Lấy toàn bộ danh sách item trong 1 giỏ hàng
    List<CartItem> findByCart_Id(Integer cartId);

    // Xóa toàn bộ item (dùng khi khách chốt đơn thành công)
    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem c WHERE c.cart.id = :cartId")
    void deleteByCart_Id(Integer cartId);

    @EntityGraph(attributePaths = {"product.attributes", "product.group.brand"})
    List<CartItem> findFullDetailsByCart_Id(Integer cartId);
    
    void deleteAllByIdIn(List<Integer> ids);
    
    Optional<CartItem> findByCart_IdAndProduct_Id(Integer cartId, Integer productId);
    
    List<CartItem> findByCart_User_IdAndIsSelected(Integer userId, boolean isSelected);
}
