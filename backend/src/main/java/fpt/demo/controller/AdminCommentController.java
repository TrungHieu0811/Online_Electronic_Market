package fpt.demo.controller;

import fpt.demo.dto.CreateCommentDto;
import fpt.demo.service.ProductCommentService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final ProductCommentService service;

    @GetMapping("/products")
    public ResponseEntity<?> getCommentProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.getAdminCommentProducts(page, size));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(service.getByProduct(productId));
    }

    @PostMapping("/reply")
    public ResponseEntity<?> adminReply(
            @Valid @RequestBody CreateCommentDto dto,
            Principal principal
    ) {
        return ResponseEntity.ok(service.adminReply(dto, principal.getName()));
    }

    @PutMapping("/product/{productId}/mark-read")
    public ResponseEntity<?> markRead(@PathVariable Integer productId) {
        service.markProductCommentsAsRead(productId);
        return ResponseEntity.ok("Marked as read");
    }
}
