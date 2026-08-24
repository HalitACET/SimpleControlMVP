package com.pdks.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "locations", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_locations_firm_code", columnNames = {"firmId", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firmId;

    @Column(nullable = false)
    private String code;

    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    @Builder.Default
    private Integer radiusMeters = 100;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
