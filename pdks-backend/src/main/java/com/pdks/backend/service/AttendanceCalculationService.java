package com.pdks.backend.service;

import com.pdks.backend.dto.DailyAttendanceDto;
import com.pdks.backend.dto.DailyAttendanceStatus;
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
                .suspiciousScanCount(w.getSuspiciousScanCount());

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

        LocalDateTime entryTime = filtered.get(0).getScannedAt();
        LocalDateTime exitTime = filtered.size() > 1 ? filtered.get(filtered.size() - 1).getScannedAt() : null;

        builder.entryTime(entryTime);
        builder.exitTime(exitTime);

        if (builder.build().getStatus() == null) {
            builder.status(exitTime == null ? DailyAttendanceStatus.EKSIK_CIKIS : DailyAttendanceStatus.NORMAL);
        }

        // Calculation logic applies if we have a shift and not holiday/no-group
        if (w.getShift() != null && !w.isHoliday() && w.isHasWorkGroup()) {
            Shift shift = w.getShift();
            LocalDateTime shiftStart = w.getDate().atTime(shift.getStartTime());
            LocalDateTime shiftEnd = builder.build().isNightShift() 
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

            if (exitTime != null) {
                // TODO: Adım 2 — mola aralığı kesişimi hesaplanacak
                long breakMinutes = 0;

                long workedTotal = ChronoUnit.MINUTES.between(entryTime, exitTime);
                long workedMinutes = Math.max(0, workedTotal - breakMinutes);
                builder.workedMinutes((int) workedMinutes);

                long netShiftMinutes = Math.max(0, ChronoUnit.MINUTES.between(shiftStart, shiftEnd) - breakMinutes);
                long overtime = Math.max(0, workedMinutes - netShiftMinutes);
                builder.overtimeMinutes((int) overtime);
            } else {
                builder.workedMinutes(0).overtimeMinutes(0);
            }
        } else {
            return buildWithZeros(builder);
        }

        return builder.build();
    }

    private DailyAttendanceDto buildWithZeros(DailyAttendanceDto.DailyAttendanceDtoBuilder builder) {
        return builder.lateMinutes(0).earlyExitMinutes(0).totalMissingMinutes(0).workedMinutes(0).overtimeMinutes(0).build();
    }
}
