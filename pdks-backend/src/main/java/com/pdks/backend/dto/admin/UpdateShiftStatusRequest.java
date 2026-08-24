package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateShiftStatusRequest {
    @NotNull(message = "Aktiflik durumu belirtilmelidir")
    private Boolean active;
}
