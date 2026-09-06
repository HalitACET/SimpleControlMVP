package com.pdks.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LocationRequest {

    @NotBlank(message = "Lokasyon kodu zorunludur.")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Lokasyon kodu yalnizca harf, rakam ve alt cizgi icerebilir.")
    private String code;

    @NotBlank(message = "Lokasyon adi zorunludur.")
    private String name;

    @NotNull(message = "Gecersiz enlem degeri.")
    @Min(value = -90, message = "Gecersiz enlem degeri.")
    @Max(value = 90, message = "Gecersiz enlem degeri.")
    private Double latitude;

    @NotNull(message = "Gecersiz boylam degeri.")
    @Min(value = -180, message = "Gecersiz boylam degeri.")
    @Max(value = 180, message = "Gecersiz boylam degeri.")
    private Double longitude;

    @NotNull(message = "Yaricap 10 ile 5000 metre arasinda olmalidir.")
    @Min(value = 10, message = "Yaricap 10 ile 5000 metre arasinda olmalidir.")
    @Max(value = 5000, message = "Yaricap 10 ile 5000 metre arasinda olmalidir.")
    private Integer radiusMeters;
}
