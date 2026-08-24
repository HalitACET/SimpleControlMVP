package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * POST /device/register isteği DTO'su.
 */
@Getter
@Setter
public class DeviceRegisterRequest {

    @NotBlank(message = "Cihaz ID boş olamaz")
    private String deviceId;

    @NotBlank(message = "Cihaz adı boş olamaz")
    private String deviceName;
}
