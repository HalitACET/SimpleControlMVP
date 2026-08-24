package com.pdks.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeviceItem {
    private String deviceId;
    private String deviceName;
    private LocalDateTime registeredAt;
    private String username;
    private String fullName;
}
