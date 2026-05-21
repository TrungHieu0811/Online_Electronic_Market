package fpt.demo.service;

import fpt.demo.entity.CategoryFilterConfig;
import fpt.demo.repository.CategoryFilterConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@Service
@RequiredArgsConstructor
public class CategoryFilterConfigService {

  private final CategoryFilterConfigRepository repository;
  private final ObjectMapper objectMapper;

  public CategoryFilterConfig getConfigBySlug(String slug) {
    return repository.findByCategorySlug(slug).orElse(null);
  }

  public CategoryFilterConfig saveConfig(String slug, String jsonConfig) {
    CategoryFilterConfig config = repository.findByCategorySlug(slug)
            .orElse(new CategoryFilterConfig());
    config.setCategorySlug(slug);
    config.setConfigData(jsonConfig);
    return repository.save(config);
  }

  // Admin: trả nguyên JsonNode, giữ toàn bộ field kể cả useFilter
  public JsonNode getFullConfig(CategoryFilterConfig config) throws Exception {
    return objectMapper.readTree(config.getConfigData());
  }

  // Non-admin: chỉ giữ filter có useFilter = true, bỏ field useFilter khỏi response
  public JsonNode getPublicConfig(CategoryFilterConfig config) throws Exception {
    JsonNode root = objectMapper.readTree(config.getConfigData());
    ObjectNode result = objectMapper.createObjectNode();

    JsonNode brand = root.get("brand");
//    if (brand != null && brand.path("useFilter").asBoolean(false)) {
    if (brand != null) {
      result.set("brand", stripUseFilter(brand));
    }

    JsonNode categories = root.get("categories");
//    if (categories != null && categories.path("useFilter").asBoolean(false)) {
    if (categories != null) {
      result.set("categories", stripUseFilter(categories));
    }

    JsonNode attributes = root.get("attributes");
    if (attributes != null && attributes.isArray()) {
      ArrayNode filteredAttrs = objectMapper.createArrayNode();
      for (JsonNode attr : attributes) {
        if (attr.path("useFilter").asBoolean(false)) {
          filteredAttrs.add(stripUseFilter(attr));
        }
      }
      result.set("attributes", filteredAttrs);
    }

    return result;
  }

  private JsonNode stripUseFilter(JsonNode node) {
    ObjectNode copy = ((ObjectNode) node).deepCopy();
    copy.remove("useFilter");
    return copy;
  }
}
