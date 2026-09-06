package com.pdks.backend.service;

import com.pdks.backend.dto.LocationRequest;
import com.pdks.backend.dto.LocationResponse;
import com.pdks.backend.entity.Location;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.LocationRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private String getFirmIdFromHeader(String authHeader) {
        if (authHeader == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadi");
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        Long userId = jwtService.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
        return user.getFirmId();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllActiveLocations(String authHeader) {
        String firmId = getFirmIdFromHeader(authHeader);
        return locationRepository.findByFirmIdAndActiveTrue(firmId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(Long id, String authHeader) {
        String firmId = getFirmIdFromHeader(authHeader);
        Location location = locationRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lokasyon bulunamadi."));
        return mapToResponse(location);
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request, String authHeader) {
        String firmId = getFirmIdFromHeader(authHeader);
        if (locationRepository.existsByFirmIdAndCodeAndActiveTrue(firmId, request.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu lokasyon kodu zaten kullaniliyor.");
        }

        Location location = Location.builder()
                .firmId(firmId)
                .code(request.getCode())
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusMeters(request.getRadiusMeters())
                .active(true)
                .build();

        return mapToResponse(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse updateLocation(Long id, LocationRequest request, String authHeader) {
        String firmId = getFirmIdFromHeader(authHeader);
        Location location = locationRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lokasyon bulunamadi."));

        if (!location.getCode().equals(request.getCode()) && locationRepository.existsByFirmIdAndCodeAndActiveTrue(firmId, request.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu lokasyon kodu zaten kullaniliyor.");
        }

        location.setCode(request.getCode());
        location.setName(request.getName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setRadiusMeters(request.getRadiusMeters());

        return mapToResponse(locationRepository.save(location));
    }

    @Transactional
    public void deleteLocation(Long id, String authHeader) {
        String firmId = getFirmIdFromHeader(authHeader);
        Location location = locationRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lokasyon bulunamadi."));
        location.setActive(false);
        locationRepository.save(location);
    }

    private LocationResponse mapToResponse(Location location) {
        LocationResponse response = new LocationResponse();
        response.setId(location.getId());
        response.setCode(location.getCode());
        response.setName(location.getName());
        response.setLatitude(location.getLatitude());
        response.setLongitude(location.getLongitude());
        response.setRadiusMeters(location.getRadiusMeters());
        response.setActive(location.isActive());
        return response;
    }
}
