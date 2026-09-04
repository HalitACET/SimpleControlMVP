package com.pdks.backend.dto;

import lombok.Data;

/**
 * Yeni kullanıcı hesabı oluşturma isteği — Faz 5.
 * Rol alanı yoktur, sunucu her zaman EMPLOYEE atar.
 * Username alanı yoktur, sunucu personelin kart numarasını (cardNo) atar.
 */
@Data
public class UserCreateRequest {
    private String password;
    private Long employeeId;
}
