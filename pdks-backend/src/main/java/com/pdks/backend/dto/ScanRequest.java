package com.pdks.backend.dto;

import com.pdks.backend.entity.TransactionMethod;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScanRequest {
    private LocalDateTime scannedAt;
    private Double latitude;
    private Double longitude;
    private Boolean mockLocation;
    private TransactionMethod method;
    private String qrContent;
    private String deviceId;
    private String clientId;
}
