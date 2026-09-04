package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Giriş/kimlik doğrulama tablosu.
 * Personel bilgisi (ad, soyad, kart) Employee entity'sine taşındı.
 * Tablo adı "users" — SQL Server'da "user" rezerve kelimedir, çakışma olmasın.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Personelin bağlı olduğu firma kodu — login'de username ile birlikte kullanılır */
    @Column(nullable = false, length = 50)
    private String firmId;

    /** Kullanıcı adı — aynı firma içinde unique olmalı */
    @Column(nullable = false, length = 100)
    private String username;

    /** BCrypt ile hashlenmiş şifre — düz metin asla saklanmaz */
    @Column(nullable = false)
    private String password;

    /** Bağlı personel kaydı — opsiyonel, bir kullanıcının personel kaydı olmayabilir */
    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** İlk girişte zorunlu şifre değişimi flag'i */
    @Column(nullable = false)
    @Builder.Default
    private boolean mustChangePassword = true;

    /** Pasif kullanıcı girişi engellenmiş sayılır */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;


    /** Kayıt oluşturulma zamanı — otomatik set edilir */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
