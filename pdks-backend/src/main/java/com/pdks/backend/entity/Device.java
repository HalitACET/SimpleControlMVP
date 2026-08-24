package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bir kullanıcıya bağlı mobil cihaz kaydı.
 * Her kullanıcının en fazla BİR cihazı olabilir (OneToOne).
 * Tablo adı "devices".
 */
@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mobil cihazın UUID'si — unique, zorunlu */
    @Column(nullable = false, unique = true, length = 100)
    private String deviceId;

    /** Cihaz adı — örn. "TECNO CM7" */
    @Column(length = 100)
    private String deviceName;

    /** Bu cihazın bağlı olduğu kullanıcı — OneToOne */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Kayıt oluşturulma zamanı — otomatik set edilir */
    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    /** Pasif cihaz artık kullanılamaz */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }
}
