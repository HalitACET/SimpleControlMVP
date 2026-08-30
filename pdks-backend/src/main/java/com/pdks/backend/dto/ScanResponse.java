package com.pdks.backend.dto;

import com.pdks.backend.entity.SuspiciousReason;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ScanResponse {
    private Long id;
    private LocalDateTime scannedAt;
    private boolean suspicious;
    private SuspiciousReason suspiciousReason;
    private String locationName;
}
