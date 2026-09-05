package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class MeNextActionResponse {
    private String suggestedType;
    private LastScanInfo lastScan;
    private TodayShiftInfo todayShift;
    private boolean holiday;

    @Data
    @Builder
    public static class LastScanInfo {
        private LocalDateTime scannedAt;
        private String method;
        private String locationName;
    }

    @Data
    @Builder
    public static class TodayShiftInfo {
        private String name;
        private LocalTime startTime;
        private LocalTime endTime;
        private boolean crossesMidnight;
    }
}
