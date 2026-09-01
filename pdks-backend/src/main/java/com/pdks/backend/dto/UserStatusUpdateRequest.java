package com.pdks.backend.dto;

import lombok.Data;

/**
 * Kullanıcı aktif/pasif durumu güncelleme isteği.
 */
@Data
public class UserStatusUpdateRequest {
    private boolean active;
}
