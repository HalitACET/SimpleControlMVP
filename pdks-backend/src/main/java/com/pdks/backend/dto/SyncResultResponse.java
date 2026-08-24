package com.pdks.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncResultResponse {
    private String clientId;
    private String status; // "SAVED" | "REJECTED"
    private String errorCode; // E.g., "DEVICE_MISMATCH", "INVALID_QR", "LOCATION_SUSPICIOUS"
    private Long transactionId;
}
