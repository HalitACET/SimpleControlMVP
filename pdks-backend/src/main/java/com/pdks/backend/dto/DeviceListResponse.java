package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeviceListResponse {
    private Long id;
    private String deviceId;
    private String deviceName;
    private LocalDateTime registeredAt;
    private boolean active;
    private Long userId;
    private String username;
    private String employeeName;
    private String cardNo;
}
