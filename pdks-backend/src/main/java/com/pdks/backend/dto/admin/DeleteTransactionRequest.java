package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteTransactionRequest {

    @NotBlank(message = "Silme gerekçesi boş bırakılamaz")
    @Size(min = 5, message = "Silme gerekçesi en az 5 karakter uzunluğunda olmalıdır")
    private String reason;
}
