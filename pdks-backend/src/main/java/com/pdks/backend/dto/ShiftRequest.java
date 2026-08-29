package com.pdks.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRequest {

    @NotBlank(message = "Vardiya adı boş bırakılamaz")
    private String name;

    @NotNull(message = "Başlangıç saati boş bırakılamaz")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati boş bırakılamaz")
    private LocalTime endTime;

    @NotNull(message = "Mola süresi boş bırakılamaz")
    @Min(value = 0, message = "Mola süresi negatif olamaz")
    private Integer breakMinutes;

    @NotNull(message = "Geç kalma toleransı boş bırakılamaz")
    @Min(value = 0, message = "Geç kalma toleransı negatif olamaz")
    private Integer lateToleranceMinutes;

    @NotNull(message = "Erken çıkış toleransı boş bırakılamaz")
    @Min(value = 0, message = "Erken çıkış toleransı negatif olamaz")
    private Integer earlyExitToleranceMinutes;
}
