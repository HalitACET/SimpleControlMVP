package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Login isteği DTO'su.
 * Login her zaman firmId + username + deviceId üçlüsüyle yapılır.
 */
@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Firma ID boş olamaz")
    private String firmId;

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    private String username;

    @NotBlank(message = "Şifre boş olamaz")
    private String password;

    /** Cihaz bağlama kontrolü için mobil cihazın UUID'si */
    @NotBlank(message = "Cihaz ID boş olamaz")
    private String deviceId;
}
