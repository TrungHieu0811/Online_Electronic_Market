package fpt.demo.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewSummaryResponse {
    private List<String> bulletPoints;
    private boolean cacheHit;
}