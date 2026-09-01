package com.pdks.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Kullanıcı hesabı yanıt DTO'su.
 * Rol alanı kasıtlı olarak dışarıya açılmıyor — sadece EMPLOYEE hesapları yönetilir.
 */
@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private boolean active;
    private boolean mustChangePassword;
    private Long employeeId;
    private String employeeName;
    private String cardNo;
    private LocalDateTime lastLoginAt;
}
