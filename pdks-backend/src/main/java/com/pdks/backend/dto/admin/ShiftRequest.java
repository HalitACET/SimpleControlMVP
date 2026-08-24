package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShiftRequest {

    @NotBlank(message = "Vardiya adı boş bırakılamaz")
    private String name;

    @NotBlank(message = "Başlangıç saati boş bırakılamaz")
    private String startTime; // "HH:mm"

    @NotBlank(message = "Bitiş saati boş bırakılamaz")
    private String endTime; // "HH:mm"

    @NotNull(message = "Mola süresi belirtilmelidir")
    private Integer breakMinutes;

    @NotNull(message = "Geç kalma toleransı belirtilmelidir")
    private Integer lateToleranceMinutes;
}
