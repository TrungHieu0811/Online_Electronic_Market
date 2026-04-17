package fpt.demo.specification;

import fpt.demo.dto.ProductFilterRequestDto;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductAttribute;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;

public class ProductSpecification {

  public static Specification<Product> hasBrands(List<String> brandIds) {
    return (root, query, cb) -> {
      if (brandIds == null || brandIds.isEmpty()) {
        return null;
      }
      return cb.in(root.get("group").get("brand").get("id")).value(brandIds);
    };
  }

  public static Specification<Product> hasCategories(List<String> cateIds) {
    return (root, query, cb) -> {
      if (cateIds == null || cateIds.isEmpty()) {
        return null;
      }
//      return cb.in(root.get("group").get("category").get("id")).value(cateIds);
      return root.get("group").get("category").get("id").in(cateIds);
    };
  }

  public static Specification<Product> hasRootCategorySlug(String rootSlug) {
    return (root, query, cb) -> {
      if (rootSlug == null || rootSlug.isEmpty()) {
        return null;
      }

      // Join: Product -> Group -> Category
      Join<Object, Object> categoryJoin = root.join("group").join("category", JoinType.LEFT);

      // Left Join lên cấp Cha
      Join<Object, Object> parentJoin = categoryJoin.join("parent", JoinType.LEFT);

      // Left Join lên cấp Ông (Grandparent)
      Join<Object, Object> grandParentJoin = parentJoin.join("parent", JoinType.LEFT);

      // Kiểm tra Slug ở cả 3 cấp
      return cb.or(
              cb.equal(categoryJoin.get("slug"), rootSlug),
              cb.equal(parentJoin.get("slug"), rootSlug),
              cb.equal(grandParentJoin.get("slug"), rootSlug)
      );
    };
  }

  public static Specification<Product> hasNameContains(String keyword) {
    return (root, query, cb) -> {
      if (keyword == null || keyword.isEmpty()) {
        return null;
      }
      return cb.like(cb.lower(root.get("variantName")), "%" + keyword + "%");
    };
  }

  public static Specification<Product> hasPriceBetween(Double min, Double max) {
    return (root, query, cb) -> {
      if (min == null && max == null) {
        return null;
      }
      if (min != null && max != null) {
        return cb.between(root.get("salePrice"), min, max);
      }
      if (min != null) {
        return cb.greaterThanOrEqualTo(root.get("salePrice"), min);
      }
      return cb.lessThanOrEqualTo(root.get("salePrice"), max);
    };
  }

  public static Specification<Product> hasAttributes(Map<String, List<String>> attributes) {
    return (root, query, cb) -> {
      if (attributes == null || attributes.isEmpty()) {
        return null;
      }
      List<Predicate> predicates = new ArrayList<>();
      for (Map.Entry<String, List<String>> entry : attributes.entrySet()) {
        List<String> validValues = entry.getValue().stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .collect(Collectors.toList());
        if (validValues.isEmpty()) {
          continue;
        }

//        Subquery<Integer> subquery = query.subquery(Integer.class);
//        Root<ProductAttribute> subRoot = subquery.from(ProductAttribute.class);
//        List<Predicate> valueMatches = new ArrayList<>();
//        for (String value : validValues) {
//          Predicate startsWith = cb.like(subRoot.get("attrValue"), value + "%");
//          Predicate notPrecededByDigit = cb.like(subRoot.get("attrValue"), "%[^0-9]" + value + "%");
//
//          valueMatches.add(cb.or(startsWith, notPrecededByDigit));
//        }
//        subquery.select(subRoot.get("product").get("id"))
//                .where(
//                        cb.equal(subRoot.get("name"), entry.getKey()),
//                        cb.or(valueMatches.toArray(Predicate[]::new))
//                );
//        predicates.add(root.get("id").in(subquery));
        Join<Product, ProductAttribute> attrJoin = root.join("attributes");

        List<Predicate> valueMatches = new ArrayList<>();
        for (String value : validValues) {
          // SQL Server Index hoạt động tốt nhất với Like 'value%'
          Predicate startsWith = cb.like(attrJoin.get("attrValue"), value + "%");
          // Lưu ý: Like '%[^0-9]...' sẽ làm SQL Server Scan bảng, nhưng cần thiết cho logic của bạn
          Predicate notPrecededByDigit = cb.like(attrJoin.get("attrValue"), "%[^0-9]" + value + "%");

          valueMatches.add(cb.or(startsWith, notPrecededByDigit));
        }

        // Điều kiện: Tên thuộc tính khớp VÀ giá trị khớp
        predicates.add(cb.and(
                cb.equal(attrJoin.get("name"), entry.getKey()),
                cb.or(valueMatches.toArray(Predicate[]::new))
        ));
      }

      if (predicates.isEmpty()) {
        return null;
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  public static Specification<Product> getSpecFromRequest(ProductFilterRequestDto filter, boolean isAdmin) {
    Specification<Product> spec = Specification.where(hasNameContains(filter.getKeyword()))
            .and(hasBrands(filter.getBrandIds()))
            .and(hasCategories(filter.getCategoryIds()))
            .and(hasRootCategorySlug(filter.getRootSlug()))
            .and(hasPriceBetween(filter.getMinPrice(), filter.getMaxPrice()))
            .and(hasAttributes(filter.getAttributes()));

    // Nếu KHÔNG phải admin, thêm các điều kiện lọc status
    if (!isAdmin) {
      spec = spec.and(isCategoryActive())
              .and(isBrandActive())
              .and(isProductGroupActive())
              .and(isProductActive());
    }
    return spec;
  }
  // Check Category status = true

  public static Specification<Product> isCategoryActive() {
    return (root, query, cb) -> cb.equal(root.get("group").get("category").get("status"), true);
  }

  public static Specification<Product> isBrandActive() {
    return (root, query, cb) -> cb.equal(root.get("group").get("brand").get("status"), true);
  }
// Check ProductGroup status = true

  public static Specification<Product> isProductGroupActive() {
    return (root, query, cb) -> cb.equal(root.get("group").get("status"), true);
  }

// Check chính sản phẩm đó status = 'ACTIVE'
  public static Specification<Product> isProductActive() {
    return (root, query, cb) -> cb.equal(root.get("status"), "ACTIVE");
  }
// end ProductSpecification
}
