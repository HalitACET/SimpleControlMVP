package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentMonthlySummaryResponse {
    private Long departmentId;
    private String departmentName;
    private int employeeCount;
    private int totalWorkedMinutes;
    private int totalLateMinutes;
    private int totalEarlyExitMinutes;
    private int totalOvertimeMinutes;
    private int totalAbsentDays;
    private int totalLateDayCount;
}