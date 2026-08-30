package com.pdks.backend.dto;

import com.pdks.backend.entity.SuspiciousReason;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScanValidationResult {
    private boolean suspicious;
    private SuspiciousReason reason;
}
