package fpt.demo.service;

import fpt.demo.dto.InventoryAlertDto;
import fpt.demo.dto.InventoryDashboardDto;
import fpt.demo.dto.InventoryForecastDto;
import fpt.demo.dto.ReorderSuggestionDto;
import fpt.demo.dto.SlowMovingDto;
import java.util.List;

public interface InventoryAiService {
    InventoryForecastDto forecastProduct(Integer productId);
    List<ReorderSuggestionDto> getReorderSuggestions();
    List<InventoryAlertDto> getStockAlerts();
    List<SlowMovingDto> getSlowMovingProducts();
    InventoryDashboardDto getDashboard(Integer productId);
}