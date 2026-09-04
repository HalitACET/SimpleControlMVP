package com.pdks.backend.dto;

import com.pdks.backend.entity.SuspiciousReason;
import com.pdks.backend.entity.TransactionMethod;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminScanResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDateTime scannedAt;
    private TransactionMethod method;
    private String locationName;
    private boolean suspicious;
    private SuspiciousReason suspiciousReason;
    private String manualNote;
    private String createdBy;
    private boolean excluded;
    private String excludedReason;
    private String excludedBy;
    private LocalDateTime excludedAt;
}
