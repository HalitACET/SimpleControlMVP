package com.pdks.backend.dto;

import com.pdks.backend.entity.TransactionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionLogResponse {
    private Long id;
    private TransactionType type;
    private LocalDateTime timestamp;
    private String locationName;
    private String message;
}
