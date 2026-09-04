package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class DailyAttendanceDto {
    private LocalDate date;
    private int dayOfWeek;
    private DailyAttendanceStatus status;
    private String shiftName;
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Integer workedMinutes;
    private Integer lateMinutes;
    private Integer earlyExitMinutes;
    private Integer totalMissingMinutes;
    private Integer overtimeMinutes;
    private int scanCount;
    private int suspiciousScanCount;
    private int excludedScanCount;
    private boolean isNightShift;
}
