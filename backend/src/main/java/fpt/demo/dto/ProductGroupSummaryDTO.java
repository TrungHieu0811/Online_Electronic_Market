package fpt.demo.dto;

public interface ProductGroupSummaryDTO {

  Integer getGroupId();

  String getGroupName();

  String getBrandName();

  String getCategoryName();

  Long getVariantCount();

  Long getMinPrice();

  String getThumbnailUrl();

  Boolean getHasFeatured();

  Boolean getStatus();
}
