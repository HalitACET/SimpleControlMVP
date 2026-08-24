package com.pdks.backend.dto;

import com.pdks.backend.entity.TransactionMethod;
import com.pdks.backend.entity.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionLogRequest {

    private TransactionType type;

    private LocalDateTime timestamp;

    @NotNull(message = "Enlem (latitude) zorunludur")
    private Double latitude;

    @NotNull(message = "Boylam (longitude) zorunludur")
    private Double longitude;

    private String qrContent;

    @NotNull(message = "Geçiş yöntemi (method) zorunludur")
    private TransactionMethod method;

    @NotBlank(message = "Cihaz ID zorunludur")
    private String deviceId;

    private Boolean mockLocation;

    private String clientId;
}
