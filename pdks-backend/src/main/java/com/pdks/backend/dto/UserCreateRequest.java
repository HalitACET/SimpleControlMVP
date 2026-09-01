package com.pdks.backend.dto;

import lombok.Data;

/**
 * Yeni kullanıcı hesabı oluşturma isteği.
 * Rol alanı yoktur — sunucu her zaman EMPLOYEE atar.
 */
@Data
public class UserCreateRequest {
    private String username;
    private String password;
    private Long employeeId;
}
