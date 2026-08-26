package com.pdks.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Personel oluşturma ve güncelleme isteği.
 * firmId ve active sunucuda belirlenir, istemciden kabul edilmez.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {

    @NotBlank(message = "Ad boş bırakılamaz")
    @Size(max = 75, message = "Ad en fazla 75 karakter olabilir")
    private String firstName;

    @NotBlank(message = "Soyad boş bırakılamaz")
    @Size(max = 75, message = "Soyad en fazla 75 karakter olabilir")
    private String lastName;

    @NotBlank(message = "Kart numarası boş bırakılamaz")
    @Size(max = 50, message = "Kart numarası en fazla 50 karakter olabilir")
    private String cardNo;
}
