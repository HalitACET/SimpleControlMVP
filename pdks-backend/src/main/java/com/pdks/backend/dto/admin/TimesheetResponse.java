package com.pdks.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String shiftName;
    private Integer year;
    private Integer month;
    private List<TimesheetDayInfo> days;
    private TimesheetTotals totals;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimesheetDayInfo {
        private String date; // "yyyy-MM-dd"
        private String dayOfWeek; // Turkish day name
        private String firstEntry; // "HH:mm" or null
        private String lastExit; // "HH:mm" or null
        private Integer workedMinutes;
        private Integer expectedMinutes;
        private Integer differenceMinutes;
        private String status; // "ABSENT", "NO_DATA", "INCOMPLETE", "LATE", "COMPLETE"
        private Integer lateMinutes;
        private List<String> anomalies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimesheetTotals {
        private Integer workedMinutes;
        private Integer expectedMinutes;
        private Integer differenceMinutes;
        private Integer lateDays;
        private Integer incompleteDays;
        private Integer absentDays;
    }
}
