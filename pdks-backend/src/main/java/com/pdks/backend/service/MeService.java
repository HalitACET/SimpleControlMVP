package com.pdks.backend.service;

import com.pdks.backend.dto.*;
import com.pdks.backend.entity.RawScan;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.RawScanRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MeService {

    private final AdminReportService adminReportService;
    private final RawScanRepository rawScanRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadi");
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }

    public MeNextActionResponse getNextAction(String authHeader) {
        User user = getUserFromToken(authHeader);
        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        LocalDate today = LocalDate.now();
        List<DailyReportResponse> dailyReports = adminReportService.getDailyReport(authHeader, today, user.getEmployee().getId(), null);
        
        String suggestedType = "GIRIS";
        MeNextActionResponse.TodayShiftInfo todayShift = null;
        boolean holiday = false;

        if (dailyReports != null && !dailyReports.isEmpty()) {
            DailyReportResponse report = dailyReports.get(0);
            suggestedType = report.getEntryTime() == null ? "GIRIS" : "CIKIS";
            
            if (report.getShiftName() != null) {
                todayShift = MeNextActionResponse.TodayShiftInfo.builder()
                        .name(report.getShiftName())
                        .startTime(report.getShiftStartTime())
                        .endTime(report.getShiftEndTime())
                        .crossesMidnight(report.isNightShift())
                        .build();
            }
            holiday = (report.getStatus() == DailyAttendanceStatus.TATIL);
        }

        RawScan lastScanRecord = rawScanRepository.findTopByEmployeeAndExcludedFalseOrderByScannedAtDesc(user.getEmployee()).orElse(null);
        MeNextActionResponse.LastScanInfo lastScan = null;
        
        if (lastScanRecord != null) {
            lastScan = MeNextActionResponse.LastScanInfo.builder()
                    .scannedAt(lastScanRecord.getScannedAt())
                    .method(lastScanRecord.getMethod() != null ? lastScanRecord.getMethod().name() : null)
                    .locationName(lastScanRecord.getLocation() != null ? lastScanRecord.getLocation().getName() : null)
                    .build();
        }

        return MeNextActionResponse.builder()
                .suggestedType(suggestedType)
                .lastScan(lastScan)
                .todayShift(todayShift)
                .holiday(holiday)
                .build();
    }

    public ScanHistoryPage getScans(String authHeader, int page, int size, LocalDate from, LocalDate to) {
        User user = getUserFromToken(authHeader);
        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<RawScan> scans;
        
        if (from != null && to != null) {
            java.time.LocalDateTime start = from.atStartOfDay();
            java.time.LocalDateTime end = to.plusDays(1).atStartOfDay().minusNanos(1);
            scans = rawScanRepository.findByEmployeeAndScannedAtBetweenOrderByScannedAtDesc(user.getEmployee(), start, end, pageable);
        } else {
            scans = rawScanRepository.findByEmployeeOrderByScannedAtDesc(user.getEmployee(), pageable);
        }
        
        List<ScanHistoryItem> content = scans.map(scan -> ScanHistoryItem.builder()
                .id(scan.getId())
                .scannedAt(scan.getScannedAt())
                .method(scan.getMethod() != null ? scan.getMethod().name() : null)
                .locationName(scan.getLocation() != null ? scan.getLocation().getName() : null)
                .suspicious(scan.getSuspicious() != null ? scan.getSuspicious() : false)
                .excluded(scan.getExcluded() != null ? scan.getExcluded() : false)
                .build()).getContent();

        return ScanHistoryPage.builder()
                .content(content)
                .page(scans.getNumber())
                .size(scans.getSize())
                .totalElements(scans.getTotalElements())
                .totalPages(scans.getTotalPages())
                .last(scans.isLast())
                .build();
    }

    public List<DailyItemResponse> getDaily(String authHeader, LocalDate from, LocalDate to) {
        User user = getUserFromToken(authHeader);
        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        List<DailyItemResponse> response = new java.util.ArrayList<>();
        
        for (LocalDate date = to; !date.isBefore(from); date = date.minusDays(1)) {
            List<DailyReportResponse> dailyReports = adminReportService.getDailyReport(authHeader, date, user.getEmployee().getId(), null);
            if (dailyReports != null && !dailyReports.isEmpty()) {
                DailyReportResponse report = dailyReports.get(0);
                response.add(DailyItemResponse.builder()
                        .date(report.getDate())
                        .dayOfWeek(report.getDayOfWeek())
                        .status(report.getStatus())
                        .shiftName(report.getShiftName())
                        .shiftStartTime(report.getShiftStartTime())
                        .shiftEndTime(report.getShiftEndTime())
                        .entryTime(report.getEntryTime())
                        .exitTime(report.getExitTime())
                        .workedMinutes(report.getWorkedMinutes())
                        .lateMinutes(report.getLateMinutes())
                        .earlyExitMinutes(report.getEarlyExitMinutes())
                        .overtimeMinutes(report.getOvertimeMinutes())
                        .scanCount(report.getScanCount())
                        .isNightShift(report.isNightShift())
                        .build());
            }
        }
        
        return response;
    }

    public SummaryResponse getSummary(String authHeader, Integer year, Integer month) {
        User user = getUserFromToken(authHeader);
        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        LocalDate now = LocalDate.now();
        int targetYear = year != null ? year : now.getYear();
        int targetMonth = month != null ? month : now.getMonthValue();

        List<MonthlyReportResponse> monthlyReports = adminReportService.getMonthlyReport(authHeader, targetYear, targetMonth, user.getEmployee().getId(), null);

        if (monthlyReports != null && !monthlyReports.isEmpty()) {
            MonthlyReportResponse report = monthlyReports.get(0);
            return SummaryResponse.builder()
                    .year(targetYear)
                    .month(targetMonth)
                    .expectedWorkDays(report.getExpectedWorkDays())
                    .attendedDays(report.getAttendedDays())
                    .absentDays(report.getAbsentDays())
                    .totalWorkedMinutes(report.getTotalWorkedMinutes())
                    .totalLateMinutes(report.getTotalLateMinutes())
                    .totalEarlyExitMinutes(report.getTotalEarlyExitMinutes())
                    .totalOvertimeMinutes(report.getTotalOvertimeMinutes())
                    .workGroupName(report.getWorkGroupName())
                    .build();
        } else {
            return SummaryResponse.builder()
                    .year(targetYear)
                    .month(targetMonth)
                    .expectedWorkDays(0)
                    .attendedDays(0)
                    .absentDays(0)
                    .totalWorkedMinutes(0)
                    .totalLateMinutes(0)
                    .totalEarlyExitMinutes(0)
                    .totalOvertimeMinutes(0)
                    .workGroupName(null)
                    .build();
        }
    }
}
