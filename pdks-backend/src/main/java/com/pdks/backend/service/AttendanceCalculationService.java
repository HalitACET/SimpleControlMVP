package com.pdks.backend.service;

import com.pdks.backend.dto.DailyAttendanceDto;
import com.pdks.backend.dto.DailyAttendanceStatus;
import com.pdks.backend.dto.WorkIntervalDto;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.Holiday;
import com.pdks.backend.entity.RawScan;
import com.pdks.backend.entity.Shift;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AttendanceCalculationService {

    public List<DailyAttendanceDto> calculate(Employee employee, LocalDate startDate, LocalDate endDate,
                                              List<Holiday> firmHolidays, List<RawScan> scans) {

        Set<LocalDate> holidayDates = firmHolidays.stream().map(Holiday::getHolidayDate).collect(Collectors.toSet());

        // 1. Compute windows for all relevant days (startDate - 1 to endDate + 1) to cover night shift overlaps
        List<DayWindow> windows = new ArrayList<>();
        LocalDate windowCalcStart = startDate.minusDays(1);
        LocalDate windowCalcEnd = endDate.plusDays(1);
        
        LocalDate current = windowCalcStart;
        while (!current.isAfter(windowCalcEnd)) {
            boolean isHoliday = holidayDates.contains(current);
            windows.add(new DayWindow(current, employee.getWorkGroup(), isHoliday));
            current = current.plusDays(1);
        }

        // 2. Distribute scans into windows
        for (RawScan scan : scans) {
            DayWindow bestWindow = null;
            long minDiff = Long.MAX_VALUE;

            for (DayWindow w : windows) {
                if (w.contains(scan.getScannedAt())) {
                    // Gece vardiyası çıkışlarının ertesi gün sabah vardiyası tarafından çalınmaması için
                    // pencerenin orta noktasına (veya vardiya bitişine) olan yakınlığa bakmak daha güvenlidir.
                    LocalDateTime windowCenter = w.getWindowStart().plusMinutes(
                            ChronoUnit.MINUTES.between(w.getWindowStart(), w.getWindowEnd()) / 2
                    );
                    long diff = Math.abs(ChronoUnit.MINUTES.between(windowCenter, scan.getScannedAt()));
                    
                    if (bestWindow == null) {
                        bestWindow = w;
                        minDiff = diff;
                    } else {
                        // Prioritize shift windows over generic (no-shift) windows
                        boolean currentHasShift = w.getShift() != null;
                        boolean bestHasShift = bestWindow.getShift() != null;
                        
                        if (currentHasShift && !bestHasShift) {
                            bestWindow = w;
                            minDiff = diff;
                        } else if (!currentHasShift && bestHasShift) {
                            // ignore generic if we already have a real shift
                            continue;
                        } else {
                            if (diff < minDiff) {
                                bestWindow = w;
                                minDiff = diff;
                            }
                        }
                    }
                }
            }

            if (bestWindow != null) {
                bestWindow.setTotalScanCount(bestWindow.getTotalScanCount() + 1);
                if (Boolean.TRUE.equals(scan.getExcluded())) {
                    bestWindow.setExcludedScanCount(bestWindow.getExcludedScanCount() + 1);
                } else if (Boolean.TRUE.equals(scan.getSuspicious())) {
                    bestWindow.setSuspiciousScanCount(bestWindow.getSuspiciousScanCount() + 1);
                } else {
                    bestWindow.getValidScans().add(scan);
                }
            }
        }

        // 3. Calculate results only for requested [startDate, endDate]
        List<DailyAttendanceDto> results = new ArrayList<>();
        current = startDate;

        while (!current.isAfter(endDate)) {
            LocalDate d = current;
            DayWindow w = windows.stream().filter(win -> win.getDate().equals(d)).findFirst().orElse(null);
            results.add(calculateDay(w));
            current = current.plusDays(1);
        }

        return results;
    }

    private DailyAttendanceDto calculateDay(DayWindow w) {
        DailyAttendanceDto.DailyAttendanceDtoBuilder builder = DailyAttendanceDto.builder()
                .date(w.getDate())
                .dayOfWeek(w.getDayOfWeek())
                .suspiciousScanCount(w.getSuspiciousScanCount())
                .intervals(new ArrayList<>());

        if (w.getDate().isAfter(LocalDate.now())) {
            builder.status(DailyAttendanceStatus.GELECEK);
            return buildWithZeros(builder);
        }

        if (!w.isHasWorkGroup()) {
            builder.status(DailyAttendanceStatus.GRUP_ATANMAMIS);
        } else if (w.isHoliday() || w.getShift() == null) {
            builder.status(DailyAttendanceStatus.TATIL);
        }

        if (w.getShift() != null) {
            builder.shiftName(w.getShift().getName());
            builder.shiftStartTime(w.getShift().getStartTime());
            builder.shiftEndTime(w.getShift().getEndTime());
            builder.isNightShift(w.getShift().getStartTime().isAfter(w.getShift().getEndTime()));
        }

        List<RawScan> validScans = w.getValidScans();
        validScans.sort(Comparator.comparing(RawScan::getScannedAt));

        // Filter 1 min duplicates
        List<RawScan> filtered = new ArrayList<>();
        for (RawScan scan : validScans) {
            if (filtered.isEmpty()) {
                filtered.add(scan);
            } else {
                RawScan last = filtered.get(filtered.size() - 1);
                long diffSecs = Math.abs(ChronoUnit.SECONDS.between(last.getScannedAt(), scan.getScannedAt()));
                if (diffSecs >= 60) {
                    filtered.add(scan);
                }
            }
        }

        builder.scanCount(w.getTotalScanCount());
        builder.excludedScanCount(w.getExcludedScanCount());

        if (filtered.isEmpty()) {
            if (builder.build().getStatus() == null) {
                builder.status(DailyAttendanceStatus.DEVAMSIZ);
            }
            return buildWithZeros(builder);
        }

        // Ciftler halinde eslestirme: (0,1), (2,3)... Tek sayida okutmada son okutma eslesmeden kalir.
        int pairCount = filtered.size() / 2;
        boolean hasUnpairedScan = filtered.size() % 2 == 1;

        LocalDateTime entryTime = filtered.get(0).getScannedAt();
        LocalDateTime exitTime = pairCount > 0 ? filtered.get(pairCount * 2 - 1).getScannedAt() : null;

        builder.entryTime(entryTime);
        builder.exitTime(exitTime);

        if (builder.build().getStatus() == null) {
            builder.status(hasUnpairedScan ? DailyAttendanceStatus.EKSIK_CIKIS : DailyAttendanceStatus.NORMAL);
        }

        Shift shift = w.getShift();
        boolean nightShift = shift != null && shift.getStartTime().isAfter(shift.getEndTime());

        // Mola penceresi LocalTime tutuluyor; calisma araliklariyla karsilastirmak icin takvim gunune yerlestirilir.
        // Gece vardiyasinda mola saati vardiya baslangicindan onceyse gece yarisi gecilmis demektir -> ertesi gun.
        LocalDateTime breakWindowStart = null;
        LocalDateTime breakWindowEnd = null;
        if (shift != null && shift.getBreakStart() != null && shift.getBreakEnd() != null) {
            LocalDate breakDate = (nightShift && shift.getBreakStart().isBefore(shift.getStartTime()))
                    ? w.getDate().plusDays(1)
                    : w.getDate();
            breakWindowStart = breakDate.atTime(shift.getBreakStart());
            breakWindowEnd = breakDate.atTime(shift.getBreakEnd());
        }

        List<WorkIntervalDto> intervals = new ArrayList<>();
        int workedMinutes = 0;

        for (int i = 0; i + 1 < filtered.size(); i += 2) {
            LocalDateTime intervalStart = filtered.get(i).getScannedAt();
            LocalDateTime intervalEnd = filtered.get(i + 1).getScannedAt();

            long rawMinutes = ChronoUnit.MINUTES.between(intervalStart, intervalEnd);
            long netMinutes = Math.max(0, rawMinutes
                    - overlapMinutes(intervalStart, intervalEnd, breakWindowStart, breakWindowEnd));

            intervals.add(WorkIntervalDto.builder()
                    .entryTime(intervalStart)
                    .exitTime(intervalEnd)
                    .minutes((int) netMinutes)
                    .build());
            workedMinutes += (int) netMinutes;
        }

        if (hasUnpairedScan) {
            intervals.add(WorkIntervalDto.builder()
                    .entryTime(filtered.get(filtered.size() - 1).getScannedAt())
                    .exitTime(null)
                    .minutes(0)
                    .build());
        }

        builder.intervals(intervals);

        // Calculation logic applies if we have a shift and not holiday/no-group
        if (shift != null && !w.isHoliday() && w.isHasWorkGroup()) {
            LocalDateTime shiftStart = w.getDate().atTime(shift.getStartTime());
            LocalDateTime shiftEnd = nightShift
                    ? w.getDate().plusDays(1).atTime(shift.getEndTime())
                    : w.getDate().atTime(shift.getEndTime());

            int lateMinutes = 0;
            long diffToStart = ChronoUnit.MINUTES.between(shiftStart, entryTime);
            if (diffToStart > shift.getLateToleranceMinutes()) {
                lateMinutes = (int) diffToStart;
            }
            builder.lateMinutes(lateMinutes);

            int earlyExitMinutes = 0;
            if (exitTime != null) {
                long diffToEnd = ChronoUnit.MINUTES.between(exitTime, shiftEnd);
                if (diffToEnd > shift.getEarlyExitToleranceMinutes()) {
                    earlyExitMinutes = (int) diffToEnd;
                }
            }
            builder.earlyExitMinutes(earlyExitMinutes);
            builder.totalMissingMinutes(lateMinutes + earlyExitMinutes);

            builder.workedMinutes(workedMinutes);

            long breakDuration = breakWindowStart != null
                    ? ChronoUnit.MINUTES.between(breakWindowStart, breakWindowEnd)
                    : 0;
            long netShiftMinutes = Math.max(0, ChronoUnit.MINUTES.between(shiftStart, shiftEnd) - breakDuration);
            builder.overtimeMinutes((int) Math.max(0, workedMinutes - netShiftMinutes));
        } else {
            return buildWithZeros(builder);
        }

        return builder.build();
    }

    /** Calisma araligi ile mola penceresinin ortusen dakikasi; pencere tanimsizsa 0. */
    private long overlapMinutes(LocalDateTime start, LocalDateTime end,
                                LocalDateTime windowStart, LocalDateTime windowEnd) {
        if (windowStart == null || windowEnd == null) {
            return 0;
        }
        LocalDateTime overlapStart = start.isAfter(windowStart) ? start : windowStart;
        LocalDateTime overlapEnd = end.isBefore(windowEnd) ? end : windowEnd;
        if (!overlapStart.isBefore(overlapEnd)) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(overlapStart, overlapEnd);
    }

    private DailyAttendanceDto buildWithZeros(DailyAttendanceDto.DailyAttendanceDtoBuilder builder) {
        return builder.lateMinutes(0).earlyExitMinutes(0).totalMissingMinutes(0).workedMinutes(0).overtimeMinutes(0).build();
    }
}
