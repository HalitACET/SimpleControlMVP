package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SummaryResponse {
    private int year;
    private int month;
    private int expectedWorkDays;
    private int attendedDays;
    private int absentDays;
    private int totalWorkedMinutes;
    private int totalLateMinutes;
    private int totalEarlyExitMinutes;
    private int totalOvertimeMinutes;
    private String workGroupName;
}
