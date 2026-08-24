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
public class CreateUserRequest {

    @NotBlank(message = "Firma kodu boş bırakılamaz")
    private String firmId;

    @NotBlank(message = "Kullanıcı adı boş bırakılamaz")
    private String username;

    @NotBlank(message = "Ad soyad boş bırakılamaz")
    private String fullName;

    @NotBlank(message = "Şifre boş bırakılamaz")
    @Pattern(regexp = "^(?=.*[0-9]).{8,}$", message = "Şifre en az 8 karakter olmalı ve en az 1 rakam içermelidir")
    private String initialPassword;

    @NotBlank(message = "Rol boş bırakılamaz")
    private String role;
}
