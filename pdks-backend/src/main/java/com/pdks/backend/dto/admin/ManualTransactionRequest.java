package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ManualTransactionRequest {

    @NotNull(message = "Personel ID belirtilmelidir")
    private Long userId;

    @NotBlank(message = "Hareket tipi belirtilmelidir")
    private String type; // "GIRIS" or "CIKIS"

    @NotBlank(message = "Zaman bilgisi belirtilmelidir")
    private String timestamp; // ISO format

    @NotBlank(message = "Not alanı boş bırakılamaz")
    @Size(min = 5, message = "Not alanı en az 5 karakter olmalıdır")
    private String note;
}
