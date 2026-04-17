package fpt.demo.service;

import java.util.List;

import fpt.demo.dto.CartItemRequest;
import fpt.demo.entity.CartItem;

public interface CartItemService {

    CartItem addToCart(String username, Integer productId, Integer quantity);

    CartItem updateQuantity(Integer cartItemId, Integer quantity);

    void removeItem(Integer cartItemId);

    List<CartItem> getMyCartItems(String username);

    CartItem toggleSelection(Integer cartItemId);

    List<CartItem> getFullCartDetails(String username);
    
    Integer getCartCount(String username);
    
    void toggleAllSelection(String username, boolean selected);
    
    void removeMultipleItems(List<Integer> ids);
    
    void mergeCart(String username, List<CartItemRequest> guestItems);
}
