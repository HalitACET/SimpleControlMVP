package com.pdks.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SimulationRequest {
    private Long employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer seed;
}
