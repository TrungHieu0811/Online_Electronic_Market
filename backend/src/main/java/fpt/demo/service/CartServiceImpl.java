package fpt.demo.service;

import fpt.demo.entity.Cart;
import fpt.demo.entity.User;
import fpt.demo.repository.CartItemRepository;
import fpt.demo.repository.CartRepository;
import fpt.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Cart getOrCreateCart(String username) {
        return cartRepository.findByUser_Username(username)
                .orElseGet(() -> {
                    User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("User not found."));

                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    newCart.setUpdatedAt(LocalDateTime.now());
                    return cartRepository.save(newCart);
                });
    }

    @Override
    @Transactional
    public void updateCartTimestamp(Integer cartId) {
        cartRepository.findById(cartId).ifPresent(cart -> {
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
        });
    }

    
}
