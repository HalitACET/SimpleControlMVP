package com.pdks.backend.service;

import com.pdks.backend.dto.BatchScanResult;
import com.pdks.backend.dto.ScanRequest;
import com.pdks.backend.dto.ScanResponse;
import com.pdks.backend.dto.ScanValidationResult;
import com.pdks.backend.entity.*;
import com.pdks.backend.repository.DeviceRepository;
import com.pdks.backend.repository.LocationRepository;
import com.pdks.backend.repository.RawScanRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import com.pdks.backend.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanService {

    private final RawScanRepository rawScanRepository;
    private final LocationRepository locationRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ScanValidationService scanValidationService;

    public ScanResponse logScan(String authHeader, ScanRequest request) {
        User user = getUserFromToken(authHeader);

        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        // Device binding
        Device device = deviceRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Cihaz eslesmedi."));
        if (!device.getDeviceId().equals(request.getDeviceId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cihaz eslesmedi.");
        }

        // Idempotency
        if (request.getClientId() != null && !request.getClientId().trim().isEmpty()) {
            Optional<RawScan> existing = rawScanRepository.findByClientId(request.getClientId());
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }

        return mapToResponse(processSingleScan(user, request));
    }

    public List<BatchScanResult> syncScans(String authHeader, List<ScanRequest> requests) {
        User user = getUserFromToken(authHeader);

        if (user.getEmployee() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel kaydi bulunamadi.");
        }

        List<BatchScanResult> results = new ArrayList<>();

        for (ScanRequest request : requests) {
            try {
                // Device binding
                Device device = deviceRepository.findByUser(user)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Cihaz eslesmedi."));
                if (!device.getDeviceId().equals(request.getDeviceId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cihaz eslesmedi.");
                }

                // Idempotency
                if (request.getClientId() != null && !request.getClientId().trim().isEmpty()) {
                    Optional<RawScan> existing = rawScanRepository.findByClientId(request.getClientId());
                    if (existing.isPresent()) {
                        results.add(BatchScanResult.builder()
                                .clientId(request.getClientId())
                                .status("SAVED")
                                .scanId(existing.get().getId())
                                .build());
                        continue;
                    }
                }

                RawScan saved = processSingleScan(user, request);
                results.add(BatchScanResult.builder()
                        .clientId(request.getClientId())
                        .status("SAVED")
                        .scanId(saved.getId())
                        .build());
            } catch (ResponseStatusException ex) {
                results.add(BatchScanResult.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode(ex.getStatusCode() == HttpStatus.FORBIDDEN ? "DEVICE_MISMATCH" : "VALIDATION_ERROR")
                        .build());
            } catch (Exception ex) {
                log.error("Sync error for clientId: " + request.getClientId(), ex);
                results.add(BatchScanResult.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode("SYSTEM_ERROR")
                        .build());
            }
        }
        return results;
    }

    private RawScan processSingleScan(User user, ScanRequest request) {
        Location location = resolveLocation(user.getFirmId(), request);
        RawScan lastScan = rawScanRepository.findTopByEmployeeOrderByScannedAtDesc(user.getEmployee()).orElse(null);
        ScanValidationResult validation = scanValidationService.validateScan(request, location, lastScan);

        RawScan rawScan = RawScan.builder()
                .employee(user.getEmployee())
                .deviceId(request.getDeviceId())
                .scannedAt(request.getScannedAt() != null ? request.getScannedAt() : LocalDateTime.now())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .mockLocation(request.getMockLocation() != null ? request.getMockLocation() : false)
                .location(location)
                .method(request.getMethod())
                .qrContent(request.getQrContent())
                .suspicious(validation.isSuspicious())
                .suspiciousReason(validation.getReason())
                .clientId(request.getClientId())
                .createdAt(LocalDateTime.now())
                .build();

        return rawScanRepository.save(rawScan);
    }

    public String getNextAction(String authHeader) {
        User user = getUserFromToken(authHeader);
        if (user.getEmployee() == null) return "giriş";

        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);

        long count = rawScanRepository.countByEmployeeAndScannedAtBetween(user.getEmployee(), startOfDay, endOfDay);
        return (count % 2 == 0) ? "giriş" : "çıkış";
    }

    private Location resolveLocation(String firmId, ScanRequest request) {
        try {
            if (request.getMethod() == TransactionMethod.QR && request.getQrContent() != null) {
                String[] parts = request.getQrContent().split(":");
                if (parts.length == 3 && "PDKS".equals(parts[0]) && firmId.equalsIgnoreCase(parts[1])) {
                    Location loc = locationRepository.findByFirmIdAndCode(firmId, parts[2]).orElse(null);
                    if (loc != null && loc.isActive()) return loc;
                }
            } else if (request.getMethod() == TransactionMethod.GPS && request.getLatitude() != null && request.getLongitude() != null) {
                List<Location> firmLocations = locationRepository.findByFirmId(firmId);
                for (Location loc : firmLocations) {
                    if (loc.isActive() && loc.getLatitude() != null && loc.getLongitude() != null) {
                        double dist = GeoUtils.distanceMeters(
                                request.getLatitude(), request.getLongitude(),
                                loc.getLatitude(), loc.getLongitude()
                        );
                        int rad = loc.getRadiusMeters() != null ? loc.getRadiusMeters() : 100;
                        if (dist <= rad) {
                            return loc;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error resolving location for scan, continuing with null location", e);
        }
        return null;
    }

    private ScanResponse mapToResponse(RawScan scan) {
        return ScanResponse.builder()
                .id(scan.getId())
                .scannedAt(scan.getScannedAt())
                .suspicious(scan.getSuspicious())
                .suspiciousReason(scan.getSuspiciousReason())
                .locationName(scan.getLocation() != null ? scan.getLocation().getName() : null)
                .build();
    }

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadi");
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }
}
