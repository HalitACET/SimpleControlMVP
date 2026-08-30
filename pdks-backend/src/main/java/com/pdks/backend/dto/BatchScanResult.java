package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BatchScanResult {
    private String clientId;
    private String status; // "SAVED" or "REJECTED"
    private Long scanId;
    private String errorCode; // null if saved
}
