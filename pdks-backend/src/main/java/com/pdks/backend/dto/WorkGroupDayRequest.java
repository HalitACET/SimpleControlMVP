package com.pdks.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkGroupDayRequest {

    @NotNull(message = "Haftanın günü boş olamaz")
    @Min(value = 1, message = "Gün değeri 1 ile 7 arasında olmalıdır")
    @Max(value = 7, message = "Gün değeri 1 ile 7 arasında olmalıdır")
    private Integer dayOfWeek;

    // Vardiya ID, null ise tatil anlamına gelir
    private Long shiftId;
}
