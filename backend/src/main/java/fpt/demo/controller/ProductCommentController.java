package fpt.demo.controller;

import fpt.demo.dto.CommentResponseDto;
import fpt.demo.dto.CreateCommentDto;
import fpt.demo.dto.UpdateCommentDto;
import fpt.demo.service.ProductCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class ProductCommentController {

    private final ProductCommentService service;

    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody CreateCommentDto dto,
            Principal principal
    ) {
        return ResponseEntity.ok(service.create(dto, principal.getName()));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<CommentResponseDto>> getByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(service.getByProduct(productId));
    }

    @GetMapping("/replies/{parentId}")
    public ResponseEntity<List<CommentResponseDto>> getReplies(@PathVariable Integer parentId) {
        return ResponseEntity.ok(service.getReplies(parentId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Integer id,
            @RequestBody UpdateCommentDto dto,
            Principal principal
    ) {
        return ResponseEntity.ok(service.update(id, dto, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Integer id,
            Principal principal
    ) {
        service.delete(id, principal.getName());
        return ResponseEntity.ok("Deleted successfully");
    }

    @PostMapping("/admin-reply")
    public ResponseEntity<?> adminReply(
            @Valid @RequestBody CreateCommentDto dto,
            Principal principal
    ) {
        return ResponseEntity.ok(service.adminReply(dto, principal.getName()));
    }
}
