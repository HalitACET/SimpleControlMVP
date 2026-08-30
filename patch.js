const fs = require('fs');
let code = fs.readFileSync('pdks-backend/src/main/java/com/pdks/backend/service/AdminReportService.java', 'utf8');

const newMethods = `
    public List<com.pdks.backend.dto.MonthlyReportResponse> getMonthlyReport(String authHeader, int year, int month, Long employeeId) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<Employee> employees = new ArrayList<>();
        if (employeeId != null) {
            Employee emp = employeeRepository.findByIdAndFirmIdWithWorkGroup(employeeId, firmId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadi"));
            employees.add(emp);
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
        List<RawScan> allScans = rawScanRepository.findAdminScans(firmId, startSearch, endSearch, employeeId, null);
        java.util.Map<Long, List<RawScan>> scansByEmployee = allScans.stream()
                .collect(Collectors.groupingBy(s -> s.getEmployee().getId()));

        List<com.pdks.backend.dto.MonthlyReportResponse> responses = new ArrayList<>();

        for (Employee emp : employees) {
            List<RawScan> empScans = scansByEmployee.getOrDefault(emp.getId(), new ArrayList<>());
            List<com.pdks.backend.dto.DailyAttendanceDto> dtos = calculationService.calculate(emp, startDate, endDate, firmHolidays, empScans);

            int expectedWorkDays = 0;
            int attendedDays = 0;
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
                if (dto.getStatus() != com.pdks.backend.dto.DailyAttendanceStatus.TATIL && dto.getStatus() != com.pdks.backend.dto.DailyAttendanceStatus.GRUP_ATANMAMIS) {
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
            
            responses.add(com.pdks.backend.dto.MonthlyReportResponse.builder()
                    .employeeId(emp.getId())
                    .employeeName(emp.getFirstName() + " " + emp.getLastName())
                    .cardNo(emp.getCardNo())
                    .workGroupName(wgName)
                    .expectedWorkDays(expectedWorkDays)
                    .attendedDays(attendedDays)
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

        List<RawScan> scans = rawScanRepository.findAdminScans(firmId, startSearch, endSearch, employeeId, null);
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
`;

code = code.replace('    private User getUserFromToken(String bearerToken) {', newMethods + '\n    private User getUserFromToken(String bearerToken) {');
fs.writeFileSync('pdks-backend/src/main/java/com/pdks/backend/service/AdminReportService.java', code);
