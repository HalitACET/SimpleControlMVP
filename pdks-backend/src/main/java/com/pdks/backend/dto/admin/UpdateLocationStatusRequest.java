package com.pdks.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLocationStatusRequest {

    @NotNull(message = "Aktiflik durumu boş bırakılamaz")
    private Boolean active;
}
