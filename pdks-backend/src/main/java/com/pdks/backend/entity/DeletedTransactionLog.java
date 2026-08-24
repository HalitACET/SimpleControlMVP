package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "deleted_transaction_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeletedTransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_transaction_id", nullable = false)
    private Long originalTransactionId;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionMethod method;

    @Column(name = "deleted_by", nullable = false)
    private String deletedBy;

    @CreationTimestamp
    @Column(name = "deleted_at", nullable = false, updatable = false)
    private LocalDateTime deletedAt;

    @Column(nullable = false, length = 1000)
    private String reason;
}
