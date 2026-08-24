package com.pdks.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long todayEntryCount;
    private long todayExitCount;
    private long currentlyInsideCount;
    private long suspiciousAttemptCount;
    private long totalActiveUsers;
}
