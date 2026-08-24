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
public class AdminTransactionItem {
    private Long id;
    private String username;
    private String fullName;
    private String type;
    private LocalDateTime timestamp;
    private String locationName;
    private String method;
    private Double latitude;
    private Double longitude;
    private boolean manual;
    private String manualNote;
}
