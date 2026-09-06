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

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    private String username;
}
