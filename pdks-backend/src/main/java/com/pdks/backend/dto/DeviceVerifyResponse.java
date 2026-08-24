package com.pdks.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * GET /device/verify yanıt DTO'su.
 */
@Getter
@Setter
@AllArgsConstructor
@Builder
public class DeviceVerifyResponse {

    /** Gelen deviceId token'daki kullanıcının kayıtlı cihazıyla eşleşiyor mu? */
    private boolean bound;

    /** Kayıtlı cihazın adı */
    private String deviceName;

    /** Cihazın kayıt zamanı */
    private LocalDateTime registeredAt;
}
