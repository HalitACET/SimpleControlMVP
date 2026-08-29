package com.pdks.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkGroupRequest {

    @NotBlank(message = "Çalışma grubu adı boş bırakılamaz")
    private String name;

    @NotNull(message = "Günlük çalışma süresi boş bırakılamaz")
    @Min(value = 1, message = "Günlük çalışma süresi pozitif olmalıdır")
    private Integer dailyWorkMinutes;

    @NotNull(message = "Günler listesi boş olamaz")
    @Size(min = 7, max = 7, message = "Tam olarak 7 günlük veri gönderilmelidir")
    @Valid
    private List<WorkGroupDayRequest> days;
}
