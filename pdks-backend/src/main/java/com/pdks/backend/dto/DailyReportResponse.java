package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DailyReportResponse extends DailyAttendanceDto {
    private Long employeeId;
    private String employeeName;
    private String cardNo;
    private String workGroupName;

    @Builder(builderMethodName = "reportBuilder")
    public DailyReportResponse(DailyAttendanceDto dto, Long employeeId, String employeeName, String cardNo, String workGroupName) {
        super(dto.getDate(), dto.getDayOfWeek(), dto.getStatus(), dto.getShiftName(), dto.getShiftStartTime(), 
              dto.getShiftEndTime(), dto.getEntryTime(), dto.getExitTime(), dto.getWorkedMinutes(), 
              dto.getLateMinutes(), dto.getEarlyExitMinutes(), dto.getTotalMissingMinutes(), dto.getOvertimeMinutes(), 
              dto.getScanCount(), dto.getSuspiciousScanCount(), dto.isNightShift());
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.cardNo = cardNo;
        this.workGroupName = workGroupName;
    }
}
