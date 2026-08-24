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
public class SuspiciousAttemptItem {
    private Long id;
    private String username;
    private String fullName;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private String reason;
    private String deviceId;
}
