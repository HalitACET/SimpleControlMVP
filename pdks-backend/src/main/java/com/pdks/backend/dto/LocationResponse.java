package com.pdks.backend.dto;

import lombok.Data;

@Data
public class LocationResponse {
    private Long id;
    private String code;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
    private boolean active;
}
