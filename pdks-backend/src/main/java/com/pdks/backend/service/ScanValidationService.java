package com.pdks.backend.service;

import com.pdks.backend.dto.ScanRequest;
import com.pdks.backend.dto.ScanValidationResult;
import com.pdks.backend.entity.Location;
import com.pdks.backend.entity.RawScan;
import com.pdks.backend.entity.SuspiciousReason;
import com.pdks.backend.entity.TransactionMethod;
import com.pdks.backend.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanValidationService {

    @Value("${fraud.max-speed-mps:42}")
    private double maxSpeedMps;

    public ScanValidationResult validateScan(ScanRequest request, Location resolvedLocation, RawScan lastScan) {
        try {
            if (request == null || request.getLatitude() == null || request.getLongitude() == null) {
                log.error("Scan request or coordinates are null. Marking as suspicious (fail-closed).");
                return new ScanValidationResult(true, null);
            }

            // 1. Mock Konum
            if (Boolean.TRUE.equals(request.getMockLocation())) {
                return new ScanValidationResult(true, SuspiciousReason.MOCK_FLAG);
            }

            // 2. Geofence
            if (request.getMethod() == TransactionMethod.QR) {
                if (resolvedLocation != null && resolvedLocation.getLatitude() != null && resolvedLocation.getLongitude() != null) {
                    double distance = GeoUtils.distanceMeters(
                            request.getLatitude(), request.getLongitude(),
                            resolvedLocation.getLatitude(), resolvedLocation.getLongitude()
                    );
                    int radius = resolvedLocation.getRadiusMeters() != null ? resolvedLocation.getRadiusMeters() : 100;
                    if (distance > radius) {
                        return new ScanValidationResult(true, SuspiciousReason.GEOFENCE_VIOLATION);
                    }
                } else {
                    return new ScanValidationResult(true, SuspiciousReason.GEOFENCE_VIOLATION);
                }
            } else if (request.getMethod() == TransactionMethod.GPS) {
                if (resolvedLocation == null) {
                    return new ScanValidationResult(true, SuspiciousReason.GEOFENCE_VIOLATION);
                }
            }

            // 3. Imkansiz Hiz & Donmus Koordinat
            if (lastScan != null && lastScan.getLatitude() != null && lastScan.getLongitude() != null && lastScan.getScannedAt() != null) {
                double distanceToLast = GeoUtils.distanceMeters(
                        request.getLatitude(), request.getLongitude(),
                        lastScan.getLatitude(), lastScan.getLongitude()
                );

                LocalDateTime currentTimestamp = request.getScannedAt() != null ? request.getScannedAt() : LocalDateTime.now();
                long secondsDiff = ChronoUnit.SECONDS.between(lastScan.getScannedAt(), currentTimestamp);

                if (secondsDiff <= 0) {
                    return new ScanValidationResult(true, SuspiciousReason.IMPOSSIBLE_SPEED);
                }

                double speedMps = distanceToLast / secondsDiff;
                if (speedMps > maxSpeedMps) {
                    return new ScanValidationResult(true, SuspiciousReason.IMPOSSIBLE_SPEED);
                }


            }

            return new ScanValidationResult(false, null);

        } catch (Exception ex) {
            log.error("Unexpected error during scan validation. Marking as suspicious (fail-closed).", ex);
            return new ScanValidationResult(true, null);
        }
}
}
