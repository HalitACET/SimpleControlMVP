package com.pdks.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetSummaryResponse {
    private Integer month;
    private Integer year;
    private Integer workedMinutes;
    private Integer expectedMinutes;
    private Integer lateDays;
    private Integer incompleteDays;
    private String shiftName;
}
