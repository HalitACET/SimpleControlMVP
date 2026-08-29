package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HolidayRequest {

    @NotNull(message = "Tatil tarihi boş bırakılamaz")
    private LocalDate holidayDate;

    @NotBlank(message = "Tatil adı boş bırakılamaz")
    private String name;
}
