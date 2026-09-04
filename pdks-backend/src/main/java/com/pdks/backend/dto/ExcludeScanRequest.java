package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExcludeScanRequest {
    @NotBlank(message = "İptal sebebi zorunludur")
    private String reason;
}
