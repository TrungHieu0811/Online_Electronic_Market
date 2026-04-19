package fpt.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fpt.demo.dto.CommentNotificationDto;
import fpt.demo.service.ProductCommentService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final ProductCommentService productCommentService;

    @GetMapping("/comments")
    public ResponseEntity<List<CommentNotificationDto>> getMyCommentNotifications(
            Principal principal) {

        String username = principal.getName();
        List<CommentNotificationDto> notifications
                = productCommentService.getMyCommentNotifications(username);

        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/comments/{id}/read")
    public ResponseEntity<String> markCommentNotificationAsRead(
            @PathVariable Integer id,
            Principal principal) {

        String username = principal.getName();
        productCommentService.markCommentNotificationAsRead(id, username);

        return ResponseEntity.ok("Notification marked as read");
    }

    @PutMapping("/comments/read-all")
    public ResponseEntity<String> markAllCommentNotificationsAsRead(Principal principal) {
        String username = principal.getName();
        productCommentService.markAllCommentNotificationsAsRead(username);
        return ResponseEntity.ok("All notifications marked as read");
    }
}
