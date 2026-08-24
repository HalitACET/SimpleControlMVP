package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLocationRequest {

    @NotBlank(message = "Konum kodu boş bırakılamaz")
    private String code;

    @NotBlank(message = "Konum adı boş bırakılamaz")
    private String name;

    @NotNull(message = "Enlem boş bırakılamaz")
    private Double latitude;

    @NotNull(message = "Boylam boş bırakılamaz")
    private Double longitude;

    @NotNull(message = "Yarıçap boş bırakılamaz")
    private Integer radiusMeters;
}
