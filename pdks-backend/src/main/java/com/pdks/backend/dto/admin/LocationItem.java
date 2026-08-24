package com.pdks.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationItem {
    private Long id;
    private String firmId;
    private String code;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
    private boolean active;
}
