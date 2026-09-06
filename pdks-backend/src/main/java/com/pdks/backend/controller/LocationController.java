package com.pdks.backend.controller;

import com.pdks.backend.dto.LocationRequest;
import com.pdks.backend.dto.LocationResponse;
import com.pdks.backend.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<List<LocationResponse>> getAllLocations(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(locationService.getAllActiveLocations(authHeader));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationResponse> getLocationById(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        return ResponseEntity.ok(locationService.getLocationById(id, authHeader));
    }

    @PostMapping
    public ResponseEntity<LocationResponse> createLocation(@RequestHeader("Authorization") String authHeader, @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.createLocation(request, authHeader));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationResponse> updateLocation(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateLocation(id, request, authHeader));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        locationService.deleteLocation(id, authHeader);
        return ResponseEntity.ok().build();
    }
}
