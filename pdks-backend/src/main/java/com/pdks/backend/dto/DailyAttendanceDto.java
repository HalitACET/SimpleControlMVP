package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
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

    /** Gun icindeki calisma araliklari; eslesmemis son okutma da listede yer alir. */
    private List<WorkIntervalDto> intervals;

    /**
     * Intervals oncesi 17 alanli kurucu — DailyReportResponse'un super() cagrisi bunu kullaniyor.
     * DailyReportResponse intervals'i da tasiyacak sekilde guncellenince silinebilir.
     */
    public DailyAttendanceDto(LocalDate date, int dayOfWeek, DailyAttendanceStatus status, String shiftName,
                              LocalTime shiftStartTime, LocalTime shiftEndTime, LocalDateTime entryTime,
                              LocalDateTime exitTime, Integer workedMinutes, Integer lateMinutes,
                              Integer earlyExitMinutes, Integer totalMissingMinutes, Integer overtimeMinutes,
                              int scanCount, int suspiciousScanCount, int excludedScanCount, boolean isNightShift) {
        this(date, dayOfWeek, status, shiftName, shiftStartTime, shiftEndTime, entryTime, exitTime,
                workedMinutes, lateMinutes, earlyExitMinutes, totalMissingMinutes, overtimeMinutes,
                scanCount, suspiciousScanCount, excludedScanCount, isNightShift, null);
    }
}
