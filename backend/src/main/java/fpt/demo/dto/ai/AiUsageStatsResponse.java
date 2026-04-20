package fpt.demo.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiUsageStatsResponse {
    private long sentimentTotal;
    private long suggestTotal;
    private long summaryTotal;
    private long summaryCacheHits;
    private long successTotal;
    private long failedTotal;
}