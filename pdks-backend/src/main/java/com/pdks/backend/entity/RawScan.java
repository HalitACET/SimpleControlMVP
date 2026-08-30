package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * scannedAt okutmanın gerçekleştiği an, createdAt kaydın sunucuya ulaştığı andır.
 * Çevrimdışı senkronizasyonda bu ikisi farklı olabilir; raporlar scannedAt kullanır.
 */
@Entity
@Table(name = "raw_scans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_raw_scans_employee"))
    private Employee employee;

    @Column(name = "device_id", nullable = false, length = 100)
    private String deviceId;

    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "mock_location")
    private Boolean mockLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", foreignKey = @ForeignKey(name = "fk_raw_scans_location"))
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionMethod method;

    @Column(name = "qr_content")
    private String qrContent;

    @Column(nullable = false)
    @Builder.Default
    private Boolean suspicious = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "suspicious_reason", length = 50)
    private SuspiciousReason suspiciousReason;

    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "manual_note", length = 500)
    private String manualNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
