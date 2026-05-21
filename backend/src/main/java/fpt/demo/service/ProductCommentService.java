package fpt.demo.service;

import java.util.List;

import org.springframework.data.domain.Page;

import fpt.demo.dto.AdminCommentProductDto;
import fpt.demo.dto.CommentNotificationDto;
import fpt.demo.dto.CommentResponseDto;
import fpt.demo.dto.CreateCommentDto;
import fpt.demo.dto.UpdateCommentDto;
import fpt.demo.entity.ProductComment;

public interface ProductCommentService {

    ProductComment create(CreateCommentDto dto, String username);

    List<CommentResponseDto> getByProduct(Integer productId);

    ProductComment update(Integer id, UpdateCommentDto dto, String username);

    List<CommentResponseDto> getReplies(Integer parentId);

    void delete(Integer id, String username);

    ProductComment adminReply(CreateCommentDto dto, String username);

    Page<AdminCommentProductDto> getAdminCommentProducts(int page, int size);

    void markProductCommentsAsRead(Integer productId);

    List<CommentNotificationDto> getMyCommentNotifications(String username);

    void markCommentNotificationAsRead(Integer notificationId, String username);

    void markAllCommentNotificationsAsRead(String username);
}
