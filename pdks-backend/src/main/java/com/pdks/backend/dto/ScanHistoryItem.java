package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ScanHistoryItem {
    private Long id;
    private LocalDateTime scannedAt;
    private String method;
    private String locationName;
    private boolean suspicious;
    private boolean excluded;
}
