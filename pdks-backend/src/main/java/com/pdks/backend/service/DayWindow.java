package com.pdks.backend.service;

import com.pdks.backend.dto.DailyAttendanceDto;
import com.pdks.backend.dto.DailyAttendanceStatus;
import com.pdks.backend.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class DayWindow {
    @Getter private LocalDate date;
    @Getter private int dayOfWeek;
    @Getter private Shift shift;
    @Getter private boolean isHoliday;
    @Getter private boolean hasWorkGroup;
    @Getter private LocalDateTime windowStart;
    @Getter private LocalDateTime windowEnd;
    
    @Getter private List<RawScan> validScans = new ArrayList<>();
    @Getter @Setter private int suspiciousScanCount = 0;
    @Getter @Setter private int excludedScanCount = 0;
    @Getter @Setter private int totalScanCount = 0;

    public DayWindow(LocalDate date, WorkGroup workGroup, boolean isHoliday) {
        this.date = date;
        this.dayOfWeek = date.getDayOfWeek().getValue();
        this.isHoliday = isHoliday;
        this.hasWorkGroup = workGroup != null;

        if (hasWorkGroup) {
            Optional<WorkGroupDay> wgDay = workGroup.getDays().stream()
                    .filter(d -> d.getDayOfWeek().getValue() == this.dayOfWeek)
                    .findFirst();
            if (wgDay.isPresent()) {
                this.shift = wgDay.get().getShift();
            }
        }

        if (this.shift != null) {
            this.windowStart = date.atTime(shift.getStartTime()).minusHours(2);
            boolean isNightShift = shift.getStartTime().isAfter(shift.getEndTime());
            LocalDate exitDate = isNightShift ? date.plusDays(1) : date;
            this.windowEnd = exitDate.atTime(shift.getEndTime()).plusHours(2);
        } else {
            // Vardiya yoksa, jenerik pencere (takvim gunu)
            this.windowStart = date.atStartOfDay();
            this.windowEnd = date.atTime(LocalTime.MAX);
        }
    }

    public boolean contains(LocalDateTime time) {
        return !time.isBefore(windowStart) && !time.isAfter(windowEnd);
    }
}
