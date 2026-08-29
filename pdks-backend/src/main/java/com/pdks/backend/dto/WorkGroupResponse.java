package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkGroupResponse {

    private Long id;
    private String name;
    private Integer dailyWorkMinutes;
    private boolean active;
    private int employeeCount;
    private List<WorkGroupDayResponse> days;
}
