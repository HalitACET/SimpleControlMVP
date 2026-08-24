package com.pdks.backend.dto;

import com.pdks.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * Başarılı login sonucunda dönen yanıt DTO'su.
 */
@Getter
@Setter
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String fullName;
    private Role role;

    /** true ise mobil uygulama kullanıcıyı şifre değiştirme ekranına yönlendirmeli */
    private boolean mustChangePassword;

    /**
     * false ise mobil uygulama /device/register çağırmalı.
     * true ise cihaz zaten kayıtlı ve doğrulandı.
     */
    private boolean deviceRegistered;
}
