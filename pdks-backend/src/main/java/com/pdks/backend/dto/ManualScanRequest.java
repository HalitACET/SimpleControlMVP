package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ManualScanRequest {
    @NotNull(message = "employeeId bos olamaz")
    private Long employeeId;
    
    @NotNull(message = "scannedAt bos olamaz")
    private LocalDateTime scannedAt;
    
    @NotBlank(message = "manualNote bos olamaz")
    private String manualNote;
}
