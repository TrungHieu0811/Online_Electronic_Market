package fpt.demo.controller;

import fpt.demo.entity.Cart;
import fpt.demo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/public/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<Cart> getMyCart(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        Cart cart = cartService.getOrCreateCart(principal.getName());
        return ResponseEntity.ok(cart);
    }
    
    
}