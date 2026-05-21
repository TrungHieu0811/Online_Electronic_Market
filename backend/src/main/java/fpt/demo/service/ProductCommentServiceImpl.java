package fpt.demo.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import fpt.demo.dto.AdminCommentProductDto;
import fpt.demo.dto.CommentNotificationDto;
import fpt.demo.dto.CommentResponseDto;
import fpt.demo.dto.CreateCommentDto;
import fpt.demo.dto.UpdateCommentDto;
import fpt.demo.dto.UserSimpleDto;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductComment;
import fpt.demo.entity.ProductGroup;
import fpt.demo.entity.ProductImage;
import fpt.demo.entity.Role;
import fpt.demo.entity.User;
import fpt.demo.repository.ProductCommentRepository;
import fpt.demo.repository.ProductGroupRepository;
import fpt.demo.repository.ProductImageRepository;
import fpt.demo.repository.ProductRepository;
import fpt.demo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductCommentServiceImpl implements ProductCommentService {

    private final ProductCommentRepository repository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository groupRepository;
    private final ProductImageRepository imageRepository;
    private final UserRepository userRepository;

    @Override
    public ProductComment create(CreateCommentDto dto, String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductComment comment = new ProductComment();
        comment.setUser(user);
        comment.setProduct(product);

        if (dto.getGroupId() != null) {
            ProductGroup group = groupRepository.findById(dto.getGroupId()).orElse(null);
            comment.setGroup(group);
        }

        if (dto.getParentId() != null) {
            ProductComment parent = repository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));

            if (!parent.getProduct().getId().equals(dto.getProductId())) {
                throw new RuntimeException("Reply not match the product");
            }

            comment.setParent(parent);
        } else {
            comment.setParent(null);
        }

        comment.setIsAdminReply(false);
        comment.setIsReadByAdmin(false);
        comment.setAdminReadAt(null);
        comment.setContent(dto.getContent());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setStatus(true);

        return repository.save(comment);
    }

    @Override
    public List<CommentResponseDto> getByProduct(Integer productId) {

        List<ProductComment> parents = repository.findByProductIdAndParentIsNull(productId);

        return parents.stream()
                .sorted(Comparator.comparing(ProductComment::getCreatedAt))
                .map(this::mapToDtoWithReplies)
                .toList();
    }

    private CommentResponseDto mapToDtoWithReplies(ProductComment comment) {
        CommentResponseDto dto = mapToDto(comment);

        List<CommentResponseDto> replyDtos = repository.findByParentId(comment.getId())
                .stream()
                .sorted(Comparator.comparing(ProductComment::getCreatedAt))
                .map(this::mapToDtoWithReplies)
                .toList();

        dto.setReplies(replyDtos);
        return dto;
    }

    @Override
    public ProductComment update(Integer id, UpdateCommentDto dto, String username) {

        ProductComment comment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You dont have permission to edit this comment");
        }

        LocalDateTime now = LocalDateTime.now();
        if (comment.getCreatedAt().isBefore(now.minusMinutes(15))) {
            throw new RuntimeException("Đã quá thời gian chỉnh sửa comment");
        }

        comment.setContent(dto.getContent());
        return repository.save(comment);
    }

    @Override
    public List<CommentResponseDto> getReplies(Integer parentId) {
        return repository.findByParentId(parentId)
                .stream()
                .sorted(Comparator.comparing(ProductComment::getCreatedAt))
                .map(this::mapToDtoWithReplies)
                .toList();
    }

    @Override
    public void delete(Integer id, String username) {

        ProductComment comment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You dont have permission to delete this comment");
        }

        repository.delete(comment);
    }

    @Override
    public ProductComment adminReply(CreateCommentDto dto, String username) {

        if (dto.getParentId() == null) {
            throw new RuntimeException("Admin reply phải có parentId");
        }

        ProductComment parent = repository.findById(dto.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUserRole() != Role.ROLE_STAFF
                && user.getUserRole() != Role.ROLE_SUPERADMIN) {
            throw new RuntimeException("You dont have permission to reply this comment");
        }

        ProductComment reply = new ProductComment();
        reply.setProduct(parent.getProduct());
        reply.setGroup(parent.getGroup());
        reply.setParent(parent);
        reply.setUser(user);

        reply.setIsAdminReply(true);
        reply.setIsReadByAdmin(true);
        reply.setAdminReadAt(LocalDateTime.now());

        reply.setIsReadByUser(false);
        reply.setUserReadAt(null);

        reply.setContent(dto.getContent());
        reply.setCreatedAt(LocalDateTime.now());
        reply.setStatus(true);

        return repository.save(reply);
    }

    @Override
    public Page<AdminCommentProductDto> getAdminCommentProducts(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<Integer> productIdPage = repository.findProductIdsWithComments(pageable);

        List<AdminCommentProductDto> content = productIdPage.getContent().stream().map(productId -> {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            List<ProductComment> comments = repository.findByProductIdOrderByCreatedAtDesc(productId);

            ProductComment latestUserComment = comments.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getStatus()))
                    .filter(c -> Boolean.FALSE.equals(c.getIsAdminReply()))
                    .findFirst()
                    .orElse(null);

            long unreadCount = repository
                    .countByProductIdAndIsAdminReplyFalseAndIsReadByAdminFalseAndStatusTrue(productId);

            List<ProductImage> imageList = imageRepository.findAllByProductId(product.getId());
            String proThumbnail = null;
            if (imageList != null && !imageList.isEmpty()) {
                proThumbnail = imageList.get(0).getImageUrl();
            }

            AdminCommentProductDto dto = new AdminCommentProductDto();
            dto.setProductId(product.getId());
            dto.setProductName(product.getVariantName());
            dto.setProductThumbnail(proThumbnail);
            dto.setNewCommentCount(unreadCount);
            dto.setLatestCommentPreview(
                    latestUserComment != null ? latestUserComment.getContent() : null);
            dto.setLatestCommentAt(
                    latestUserComment != null ? latestUserComment.getCreatedAt() : null);

            return dto;
        }).toList();

        return new PageImpl<>(content, pageable, productIdPage.getTotalElements());
    }

    private CommentResponseDto mapToDto(ProductComment comment) {

        CommentResponseDto dto = new CommentResponseDto();

        dto.setId(comment.getId());
        dto.setParentId(comment.getParent() != null ? comment.getParent().getId() : null);
        dto.setContent(comment.getContent());
        dto.setIsAdminReply(comment.getIsAdminReply());
        dto.setIsReadByAdmin(comment.getIsReadByAdmin());
        dto.setAdminReadAt(comment.getAdminReadAt());
        dto.setCreatedAt(comment.getCreatedAt());

        UserSimpleDto userDto = new UserSimpleDto();
        userDto.setId(comment.getUser().getId());
        userDto.setUsername(comment.getUser().getUsername());

        dto.setUser(userDto);

        return dto;
    }

    @Override
    @Transactional
    public void markProductCommentsAsRead(Integer productId) {
        repository.markAllUserCommentsAsReadByProductId(productId, LocalDateTime.now());
    }

    @Override
    public List<CommentNotificationDto> getMyCommentNotifications(String username) {
        List<ProductComment> adminReplies = repository.findAdminRepliesForUser(username);

        return adminReplies.stream().map(comment -> {
            CommentNotificationDto dto = new CommentNotificationDto();
            dto.setId(comment.getId());
            dto.setTitle("Admin replied to your comment");
            dto.setMessage(comment.getContent());
            dto.setProductId(comment.getProduct() != null ? comment.getProduct().getId() : null);
            dto.setCommentId(comment.getParent() != null ? comment.getParent().getId() : null);
            dto.setIsRead(Boolean.TRUE.equals(comment.getIsReadByUser()));
            dto.setCreatedAt(comment.getCreatedAt());
            return dto;
        }).toList();
    }

    @Override
    @Transactional
    public void markCommentNotificationAsRead(Integer notificationId, String username) {
        ProductComment comment = repository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!Boolean.TRUE.equals(comment.getIsAdminReply())) {
            throw new RuntimeException("This comment is not an admin reply notification");
        }

        if (comment.getParent() == null || comment.getParent().getUser() == null) {
            throw new RuntimeException("Invalid notification owner");
        }

        String ownerUsername = comment.getParent().getUser().getUsername();

        if (!ownerUsername.equals(username)) {
            throw new RuntimeException("You do not have permission to update this notification");
        }

        comment.setIsReadByUser(true);
        comment.setUserReadAt(LocalDateTime.now());

        repository.save(comment);
    }

    @Override
    @Transactional
    public void markAllCommentNotificationsAsRead(String username) {
        repository.markAllAdminReplyNotificationsAsReadByUsername(username, LocalDateTime.now());
    }
}
