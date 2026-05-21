package fpt.demo.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewModerationResponse {
    private String decision; // APPROVED or REJECTED
    private String reason;
}