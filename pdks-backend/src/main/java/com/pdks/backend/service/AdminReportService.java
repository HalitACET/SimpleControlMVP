package com.pdks.backend.service;

import com.pdks.backend.dto.DailyReportResponse;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.Holiday;
import com.pdks.backend.entity.RawScan;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.HolidayRepository;
import com.pdks.backend.repository.RawScanRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminReportService {

    private final AttendanceCalculationService calculationService;
    private final EmployeeRepository employeeRepository;
    private final RawScanRepository rawScanRepository;
    private final HolidayRepository holidayRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public List<DailyReportResponse> getDailyReport(String authHeader, LocalDate date, Long employeeId, Long departmentId) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<Employee> employees = new ArrayList<>();
        if (employeeId != null) {
            Employee emp = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadi"));
            if (!emp.getFirmId().equals(firmId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Baska firmanin personeli");
            }
            if (departmentId == null || (emp.getDepartment() != null && emp.getDepartment().getId().equals(departmentId))) {
                employees.add(emp);
            }
        } else if (departmentId != null) {
            employees = employeeRepository.findByDepartmentIdAndActiveTrueAndFirmId(departmentId, firmId);
        } else {
            employees = employeeRepository.findByFirmIdAndActiveTrue(firmId);
        }

        List<Holiday> firmHolidays = holidayRepository.findByFirmIdOrderByHolidayDateAsc(firmId);

        // Pencere tasma ihtimali: [date - 1 gun, date + 1 gun]. Ozetle -24h ile +48h arasi yeterli ama biz gune gore alacagiz.
        LocalDateTime startSearch = date.minusDays(1).atStartOfDay();
        LocalDateTime endSearch = date.plusDays(2).atStartOfDay();

        List<DailyReportResponse> responses = new ArrayList<>();

        for (Employee emp : employees) {
            List<RawScan> scans = rawScanRepository.findAdminScans(firmId, startSearch, endSearch, emp.getId(), null, null, null);
            var dtos = calculationService.calculate(emp, date, date, firmHolidays, scans);
            if (!dtos.isEmpty()) {
                var dto = dtos.get(0);
                String wgName = emp.getWorkGroup() != null ? emp.getWorkGroup().getName() : null;
                String deptName = emp.getDepartment() != null ? emp.getDepartment().getName() : null;
                responses.add(DailyReportResponse.reportBuilder()
                        .dto(dto)
                        .employeeId(emp.getId())
                        .employeeName(emp.getFirstName() + " " + emp.getLastName())
                        .cardNo(emp.getCardNo())
                        .workGroupName(wgName)
                        .departmentName(deptName)
                        .build());
            }
        }

        return responses;
    }


    public List<com.pdks.backend.dto.MonthlyReportResponse> getMonthlyReport(String authHeader, int year, int month, Long employeeId, Long departmentId) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<Employee> employees = new ArrayList<>();
        if (employeeId != null) {
            Employee emp = employeeRepository.findByIdAndFirmIdWithWorkGroup(employeeId, firmId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadi"));
            if (departmentId == null || (emp.getDepartment() != null && emp.getDepartment().getId().equals(departmentId))) {
                employees.add(emp);
            }
        } else if (departmentId != null) {
            employees = employeeRepository.findByFirmIdAndActiveTrueWithWorkGroupAndDepartmentId(firmId, departmentId);
        } else {
            employees = employeeRepository.findByFirmIdAndActiveTrueWithWorkGroup(firmId);
        }

        List<Holiday> firmHolidays = holidayRepository.findByFirmIdOrderByHolidayDateAsc(firmId);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        // Gece vardiyasi tasmalarini kapsamak icin okutma araligi [onceki ay son gunu, sonraki ay ilk 2 gunu]
        LocalDateTime startSearch = startDate.minusDays(1).atStartOfDay();
        LocalDateTime endSearch = endDate.plusDays(2).atStartOfDay();

        // N+1 onlemek icin tek sorguda tum personelin okutmalari cekilir
        List<RawScan> allScans = rawScanRepository.findAdminScans(firmId, startSearch, endSearch, employeeId, departmentId, null, null);
        java.util.Map<Long, List<RawScan>> scansByEmployee = allScans.stream()
                .collect(Collectors.groupingBy(s -> s.getEmployee().getId()));

        List<com.pdks.backend.dto.MonthlyReportResponse> responses = new ArrayList<>();

        for (Employee emp : employees) {
            List<RawScan> empScans = scansByEmployee.getOrDefault(emp.getId(), new ArrayList<>());
            List<com.pdks.backend.dto.DailyAttendanceDto> dtos = calculationService.calculate(emp, startDate, endDate, firmHolidays, empScans);

            int expectedWorkDays = 0;
            int attendedDays = 0;
            int holidayWorkDays = 0;
            int absentDays = 0;
            int missingExitDays = 0;
            int totalWorkedMinutes = 0;
            int totalLateMinutes = 0;
            int totalEarlyExitMinutes = 0;
            int totalMissingMinutes = 0;
            int totalOvertimeMinutes = 0;
            int lateDayCount = 0;
            int suspiciousScanCount = 0;

            for (com.pdks.backend.dto.DailyAttendanceDto dto : dtos) {
                if (dto.getStatus() != com.pdks.backend.dto.DailyAttendanceStatus.TATIL && 
                    dto.getStatus() != com.pdks.backend.dto.DailyAttendanceStatus.GRUP_ATANMAMIS && 
                    dto.getStatus() != com.pdks.backend.dto.DailyAttendanceStatus.GELECEK) {
                    expectedWorkDays++;
                }
                
                if (dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.DEVAMSIZ) {
                    absentDays++;
                } else if (dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.EKSIK_CIKIS) {
                    missingExitDays++;
                    attendedDays++;
                } else if (dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.NORMAL) {
                    attendedDays++;
                } else if ((dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.TATIL || dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.GRUP_ATANMAMIS) && dto.getScanCount() > 0) {
                    attendedDays++; // TATIL de olsa gelmis
                    if (dto.getStatus() == com.pdks.backend.dto.DailyAttendanceStatus.TATIL) {
                        holidayWorkDays++;
                    }
                }

                if (dto.getLateMinutes() != null && dto.getLateMinutes() > 0) {
                    lateDayCount++;
                    totalLateMinutes += dto.getLateMinutes();
                }
                if (dto.getEarlyExitMinutes() != null) totalEarlyExitMinutes += dto.getEarlyExitMinutes();
                if (dto.getTotalMissingMinutes() != null) totalMissingMinutes += dto.getTotalMissingMinutes();
                if (dto.getWorkedMinutes() != null) totalWorkedMinutes += dto.getWorkedMinutes();
                if (dto.getOvertimeMinutes() != null) totalOvertimeMinutes += dto.getOvertimeMinutes();
                suspiciousScanCount += dto.getSuspiciousScanCount();
            }

            String wgName = emp.getWorkGroup() != null ? emp.getWorkGroup().getName() : null;
            Long deptId = emp.getDepartment() != null ? emp.getDepartment().getId() : null;
            String deptName = emp.getDepartment() != null ? emp.getDepartment().getName() : null;
            
            responses.add(com.pdks.backend.dto.MonthlyReportResponse.builder()
                    .employeeId(emp.getId())
                    .employeeName(emp.getFirstName() + " " + emp.getLastName())
                    .cardNo(emp.getCardNo())
                    .workGroupName(wgName)
                    .departmentId(deptId)
                    .departmentName(deptName)
                    .expectedWorkDays(expectedWorkDays)
                    .attendedDays(attendedDays)
                    .holidayWorkDays(holidayWorkDays)
                    .absentDays(absentDays)
                    .missingExitDays(missingExitDays)
                    .totalWorkedMinutes(totalWorkedMinutes)
                    .totalLateMinutes(totalLateMinutes)
                    .totalEarlyExitMinutes(totalEarlyExitMinutes)
                    .totalMissingMinutes(totalMissingMinutes)
                    .totalOvertimeMinutes(totalOvertimeMinutes)
                    .lateDayCount(lateDayCount)
                    .suspiciousScanCount(suspiciousScanCount)
                    .build());
        }

        return responses;
    }

    public List<DailyReportResponse> getMonthlyReportDetail(String authHeader, int year, int month, Long employeeId) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Employee emp = employeeRepository.findByIdAndFirmIdWithWorkGroup(employeeId, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadi"));

        List<Holiday> firmHolidays = holidayRepository.findByFirmIdOrderByHolidayDateAsc(firmId);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        LocalDateTime startSearch = startDate.minusDays(1).atStartOfDay();
        LocalDateTime endSearch = endDate.plusDays(2).atStartOfDay();

        List<RawScan> scans = rawScanRepository.findAdminScans(firmId, startSearch, endSearch, employeeId, null, null, null);
        List<com.pdks.backend.dto.DailyAttendanceDto> dtos = calculationService.calculate(emp, startDate, endDate, firmHolidays, scans);

        List<DailyReportResponse> responses = new ArrayList<>();
        String wgName = emp.getWorkGroup() != null ? emp.getWorkGroup().getName() : null;

        for (var dto : dtos) {
            responses.add(DailyReportResponse.reportBuilder()
                    .dto(dto)
                    .employeeId(emp.getId())
                    .employeeName(emp.getFirstName() + " " + emp.getLastName())
                    .cardNo(emp.getCardNo())
                    .workGroupName(wgName)
                    .build());
        }

        return responses;
    }

    public List<com.pdks.backend.dto.DepartmentMonthlySummaryResponse> getMonthlyReportByDepartment(String authHeader, int year, int month) {
        List<com.pdks.backend.dto.MonthlyReportResponse> allEmployees = getMonthlyReport(authHeader, year, month, null, null);

        java.util.Map<Long, com.pdks.backend.dto.DepartmentMonthlySummaryResponse> map = new java.util.HashMap<>();
        
        com.pdks.backend.dto.DepartmentMonthlySummaryResponse unassigned = new com.pdks.backend.dto.DepartmentMonthlySummaryResponse();
        unassigned.setDepartmentName("Atanmamış");

        for (var emp : allEmployees) {
            com.pdks.backend.dto.DepartmentMonthlySummaryResponse summary;
            if (emp.getDepartmentId() == null) {
                summary = unassigned;
            } else {
                summary = map.computeIfAbsent(emp.getDepartmentId(), k -> {
                    var s = new com.pdks.backend.dto.DepartmentMonthlySummaryResponse();
                    s.setDepartmentId(k);
                    s.setDepartmentName(emp.getDepartmentName());
                    return s;
                });
            }

            summary.setEmployeeCount(summary.getEmployeeCount() + 1);
            summary.setTotalWorkedMinutes(summary.getTotalWorkedMinutes() + emp.getTotalWorkedMinutes());
            summary.setTotalLateMinutes(summary.getTotalLateMinutes() + emp.getTotalLateMinutes());
            summary.setTotalEarlyExitMinutes(summary.getTotalEarlyExitMinutes() + emp.getTotalEarlyExitMinutes());
            summary.setTotalOvertimeMinutes(summary.getTotalOvertimeMinutes() + emp.getTotalOvertimeMinutes());
            summary.setTotalAbsentDays(summary.getTotalAbsentDays() + emp.getAbsentDays());
            summary.setTotalLateDayCount(summary.getTotalLateDayCount() + emp.getLateDayCount());
        }

        List<com.pdks.backend.dto.DepartmentMonthlySummaryResponse> result = new ArrayList<>(map.values());
        if (unassigned.getEmployeeCount() > 0) {
            result.add(unassigned);
        }

        // Departman adina gore siralayalim (isteğe bağlı)
        result.sort((a, b) -> {
            if (a.getDepartmentId() == null) return 1;
            if (b.getDepartmentId() == null) return -1;
            return a.getDepartmentName().compareTo(b.getDepartmentName());
        });

        return result;
    }

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadi");
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }
}
