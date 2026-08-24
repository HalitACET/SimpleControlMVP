package com.pdks.backend.service;

import com.pdks.backend.dto.TransactionLogRequest;
import com.pdks.backend.entity.*;
import com.pdks.backend.exception.LocationSuspiciousException;
import com.pdks.backend.repository.SuspiciousAttemptRepository;
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
public class FraudDetectionService {

    private final SuspiciousAttemptRepository suspiciousAttemptRepository;

    @Value("${fraud.max-speed-mps:42}")
    private double maxSpeedMps;

    @Value("${fraud.frozen-coordinate-check:true}")
    private boolean frozenCoordinateCheck;

    public void validateTransaction(User user, TransactionLogRequest request, Location resolvedLocation, TransactionRecord lastTransaction) {
        try {
            if (request == null || request.getLatitude() == null || request.getLongitude() == null) {
                log.warn("Transaction request or coordinates are null. Skipping fraud validation.");
                return;
            }

            // 1. Mock Konum Kontrolü
            if (Boolean.TRUE.equals(request.getMockLocation())) {
                logSuspiciousAttempt(user, request, SuspiciousReason.MOCK_FLAG);
                throw new LocationSuspiciousException();
            }

            // 2. Geofence Kontrolü
            if (request.getMethod() == TransactionMethod.QR) {
                if (resolvedLocation != null && resolvedLocation.getLatitude() != null && resolvedLocation.getLongitude() != null) {
                    double distance = GeoUtils.distanceMeters(
                            request.getLatitude(), request.getLongitude(),
                            resolvedLocation.getLatitude(), resolvedLocation.getLongitude()
                    );

                    Integer radius = resolvedLocation.getRadiusMeters() != null ? resolvedLocation.getRadiusMeters() : 100;
                    if (distance > radius) {
                        logSuspiciousAttempt(user, request, SuspiciousReason.GEOFENCE_VIOLATION);
                        throw new LocationSuspiciousException();
                    }
                } else {
                    throw new LocationSuspiciousException();
                }
            } else if (request.getMethod() == TransactionMethod.GPS) {
                if (resolvedLocation == null) {
                    logSuspiciousAttempt(user, request, SuspiciousReason.GEOFENCE_VIOLATION);
                    throw new LocationSuspiciousException();
                }
            }

            if (lastTransaction != null && lastTransaction.getLatitude() != null && lastTransaction.getLongitude() != null && lastTransaction.getTimestamp() != null) {
                // 3. Işınlanma (İmkansız Hız) Kontrolü
                double distanceToLast = GeoUtils.distanceMeters(
                        request.getLatitude(), request.getLongitude(),
                        lastTransaction.getLatitude(), lastTransaction.getLongitude()
                );

                LocalDateTime currentTimestamp = request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now();
                long secondsDiff = ChronoUnit.SECONDS.between(lastTransaction.getTimestamp(), currentTimestamp);

                if (secondsDiff <= 0) {
                    // Aynı saniyede veya zamanda geriye gitme durumu
                    logSuspiciousAttempt(user, request, SuspiciousReason.IMPOSSIBLE_SPEED);
                    throw new LocationSuspiciousException();
                }

                double speedMps = distanceToLast / secondsDiff;
                if (speedMps > maxSpeedMps) {
                    logSuspiciousAttempt(user, request, SuspiciousReason.IMPOSSIBLE_SPEED);
                    throw new LocationSuspiciousException();
                }

                // 4. Donmuş Koordinat Kontrolü
                if (frozenCoordinateCheck) {
                    if (isExactlySameCoordinate(request.getLatitude(), lastTransaction.getLatitude()) &&
                        isExactlySameCoordinate(request.getLongitude(), lastTransaction.getLongitude())) {
                        logSuspiciousAttempt(user, request, SuspiciousReason.FROZEN_COORDINATE);
                        throw new LocationSuspiciousException();
                    }
                }
            }
        } catch (LocationSuspiciousException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Beklenmeyen hata - FraudDetectionService. Kontrol guvenli sekilde atlandi.", ex);
        }
    }

    private boolean isExactlySameCoordinate(Double val1, Double val2) {
        if (val1 == null || val2 == null) return false;
        // Virgülden sonra 6 haneye kadar BİREBİR aynıysa
        double rounded1 = Math.round(val1 * 1_000_000.0) / 1_000_000.0;
        double rounded2 = Math.round(val2 * 1_000_000.0) / 1_000_000.0;
        return Double.compare(rounded1, rounded2) == 0;
    }

    private void logSuspiciousAttempt(User user, TransactionLogRequest request, SuspiciousReason reason) {
        try {
            SuspiciousAttempt attempt = SuspiciousAttempt.builder()
                    .user(user)
                    .timestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .reason(reason)
                    .deviceId(request.getDeviceId())
                    .build();
            suspiciousAttemptRepository.save(attempt);
            log.warn("Suspicious transaction attempt blocked. User: {}, Reason: {}", user.getUsername(), reason);
        } catch (Exception ex) {
            log.error("Suspicious attempt log database write failed. Skipping database logging.", ex);
        }
    }
}
