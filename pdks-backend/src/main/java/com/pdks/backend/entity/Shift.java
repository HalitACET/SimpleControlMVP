package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String firmId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    @Builder.Default
    private Integer breakMinutes = 60;

    @Column(nullable = false)
    @Builder.Default
    private Integer lateToleranceMinutes = 10;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
