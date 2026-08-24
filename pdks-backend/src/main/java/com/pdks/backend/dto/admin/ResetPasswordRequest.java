package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Yeni şifre boş bırakılamaz")
    @Pattern(regexp = "^(?=.*[0-9]).{8,}$", message = "Şifre en az 8 karakter olmalı ve en az 1 rakam içermelidir")
    private String newPassword;
}
