package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyItemResponse {
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
    private Integer overtimeMinutes;
    private int scanCount;
    private boolean isNightShift;
}
