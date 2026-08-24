package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Şifre değiştirme isteği DTO'su.
 * newPassword: en az 8 karakter, en az 1 rakam içermeli.
 */
@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank(message = "Mevcut şifre boş olamaz")
    private String oldPassword;

    @NotBlank(message = "Yeni şifre boş olamaz")
    @Size(min = 8, message = "Yeni şifre en az 8 karakter olmalıdır")
    @Pattern(regexp = ".*\\d.*", message = "Yeni şifre en az bir rakam içermelidir")
    private String newPassword;
}
