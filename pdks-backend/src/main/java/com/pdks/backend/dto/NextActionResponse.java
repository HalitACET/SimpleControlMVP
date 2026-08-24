package com.pdks.backend.dto;

import com.pdks.backend.entity.TransactionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NextActionResponse {

    private TransactionType suggestedType;
    private LastTransactionInfo lastTransaction;
    private ShiftInfo shift;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShiftInfo {
        private String name;
        private String startTime;
        private String endTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LastTransactionInfo {
        private TransactionType type;
        private LocalDateTime timestamp;
        private String locationName;
    }
}
