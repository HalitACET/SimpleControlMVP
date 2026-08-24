package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * POST /admin/device-unbind isteği DTO'su.
 */
@Getter
@Setter
public class DeviceUnbindRequest {

    @NotBlank(message = "Firma ID boş olamaz")
    private String firmId;

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    private String username;
}
