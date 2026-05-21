package fpt.demo.service;

import fpt.demo.entity.Cart;
import fpt.demo.entity.CartItem;

public interface CartService {
    Cart getOrCreateCart(String username);
    void updateCartTimestamp(Integer cartId);
    
}