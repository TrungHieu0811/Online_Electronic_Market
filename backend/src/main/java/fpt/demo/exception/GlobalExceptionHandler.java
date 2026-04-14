package fpt.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  // Bắt lỗi Validation (từ các thẻ @NotBlank, @Email trong DTO)
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error
            -> errors.put(error.getField(), error.getDefaultMessage()));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
  }

  // Bắt các lỗi logic nghiệp vụ do bạn tự throw (như sai mật khẩu, trùng email...)
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
  }

  // 3. Hứng RuntimeException (Lỗi phổ biến nhất khi code xử lý bị sai hoặc bạn tự throw RuntimeException)
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
    // Trả về lỗi 400 (Bad Request) kèm nội dung lỗi cụ thể
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
  }

  // 4. "Lưới chốt chặn cuối cùng" - Hứng tất cả các lỗi hệ thống khác (Exception.class)
  // Ví dụ: Lỗi kết nối Database, lỗi NullPointerException không mong muốn, lỗi Server...
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleGlobalException(Exception ex) {
    // Với lỗi hệ thống chưa xác định, nên trả về 500 (Internal Server Error)
    // Và thông báo một câu thân thiện để tránh lộ thông tin kỹ thuật bảo mật
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Đã có lỗi hệ thống xảy ra. Vui lòng liên hệ quản trị viên!"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
    String message = "Dữ liệu đã tồn tại hoặc vi phạm ràng buộc hệ thống.";

    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", message));
  }
}
