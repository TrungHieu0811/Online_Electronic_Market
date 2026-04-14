package fpt.demo.specification;

import fpt.demo.dto.ProductFilterRequestDto;
import fpt.demo.entity.Product;
import fpt.demo.entity.ProductAttribute;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
        Subquery<Integer> subquery = query.subquery(Integer.class);
        Root<ProductAttribute> subRoot = subquery.from(ProductAttribute.class);
        subquery.select(subRoot.get("product").get("id")).where(cb.equal(subRoot.get("name"), entry.getKey()), subRoot.get("attrValue").in(entry.getValue()));
        predicates.add(root.get("id").in(subquery));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  public static Specification<Product> getSpecFromRequest(ProductFilterRequestDto filter) {
    return Specification.where(hasNameContains(filter.getKeyword()))
            .and(hasBrands(filter.getBrandIds()))
            .and(hasCategories(filter.getCategoryIds()))
            .and(hasPriceBetween(filter.getMinPrice(), filter.getMaxPrice()))
            .and(hasAttributes(filter.getAttributes()));
  }
// end ProductSpecification
}
