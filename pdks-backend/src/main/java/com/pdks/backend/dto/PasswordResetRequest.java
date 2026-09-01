package com.pdks.backend.dto;

import lombok.Data;

/**
 * Şifre sıfırlama isteği.
 * mustChangePassword otomatik olarak true yapılır.
 */
@Data
public class PasswordResetRequest {
    private String newPassword;
}
