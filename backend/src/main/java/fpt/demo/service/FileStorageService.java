///*
// * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
// * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
// */
//package fpt.demo.service;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.nio.file.StandardCopyOption;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//@Service
//public class FileStorageService {
//
//  @Value("${upload.path}")
//  private String uploadPath;
//
//  public String saveFile(MultipartFile file, String subLocation) {
//    String finalLocation = uploadPath + subLocation;
//    try {
//      // 1. Tạo thư mục nếu chưa tồn tại
//      Path root = Paths.get(finalLocation);
//      if (!Files.exists(root)) {
//        Files.createDirectories(root);
//      }
//
//      // 2. Tạo tên file duy nhất (để không bị ghi đè)
//      String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
//
//      // 3. Copy file vào thư mục
//      Files.copy(file.getInputStream(), root.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
//
//      // Trả về đường dẫn để lưu vào DB (ví dụ: uploads/brands/123_logo.png)
//      // return finalLocation + "/" + fileName;
//      return "/" + subLocation + "/" + fileName;
//    } catch (Exception e) {
//      throw new RuntimeException("Không thể lưu file: " + e.getMessage());
//    }
//  }
//
//  public void deleteFile(String filePath) {
//    try {
//      if (filePath != null && !filePath.isEmpty()) {
//        Path path = Paths.get(uploadPath+filePath);
//        Files.deleteIfExists(path); // Xóa nếu file tồn tại
//      }
//    } catch (IOException e) {
//      // Log lỗi nhưng không nhất thiết phải dừng chương trình
//      System.err.println("Không thể xóa file cũ: " + e.getMessage());
//    }
//  }
//}

package fpt.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

  @Value("${upload.path}")
  private String uploadPath;

  public String saveFile(MultipartFile file, String subLocation) {
    String finalLocation = uploadPath + "/" + subLocation;
    try {
      Path root = Paths.get(finalLocation);
      if (!Files.exists(root)) {
        Files.createDirectories(root);
      }

      String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

      Files.copy(file.getInputStream(), root.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

      return "/" + subLocation + "/" + fileName;
    } catch (Exception e) {
      throw new RuntimeException("Cannot save file: " + e.getMessage());
    }
  }

  public void deleteFile(String filePath) {
    try {
      if (filePath != null && !filePath.isEmpty()) {
        Path path = Paths.get(uploadPath + filePath);
        Files.deleteIfExists(path);
      }
    } catch (IOException e) {
      System.err.println("Cannot delete old file: " + e.getMessage());
    }
  }
}