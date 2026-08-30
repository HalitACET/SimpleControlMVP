package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyReportResponse {
    private Long employeeId;
    private String employeeName;
    private String cardNo;
    private String workGroupName;

    private int expectedWorkDays;
    private int attendedDays;
    private int holidayWorkDays;
    private int absentDays;
    private int missingExitDays;

    private int totalWorkedMinutes;
    private int totalLateMinutes;
    private int totalEarlyExitMinutes;
    private int totalMissingMinutes;
    private int totalOvertimeMinutes;

    private int lateDayCount;
    private int suspiciousScanCount;
}
