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
public class AdminUserItem {
    private Long id;
    private String firmId;
    private String username;
    private String fullName;
    private String role;
    private boolean active;
    private boolean mustChangePassword;
    private boolean hasDevice;
    private LocalDateTime createdAt;
    private String shiftName;
}
