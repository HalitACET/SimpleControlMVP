package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponse {

    private Long id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer breakMinutes;
    private Integer lateToleranceMinutes;
    private Integer earlyExitToleranceMinutes;
    
    // Hesaplanmış alanlar
    private boolean crossesMidnight;
    private Integer durationMinutes;
}
