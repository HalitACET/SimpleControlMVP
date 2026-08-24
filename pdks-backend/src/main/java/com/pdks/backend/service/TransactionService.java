package com.pdks.backend.service;

import com.pdks.backend.dto.*;
import com.pdks.backend.entity.*;
import com.pdks.backend.exception.DeviceMismatchException;
import com.pdks.backend.exception.InvalidQrException;
import com.pdks.backend.repository.DeviceRepository;
import com.pdks.backend.repository.LocationRepository;
import com.pdks.backend.repository.TransactionRecordRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import com.pdks.backend.util.GeoUtils;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRecordRepository transactionRepository;
    private final LocationRepository locationRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final FraudDetectionService fraudDetectionService;

    // ─── Son Harekete Göre Öneri ──────────────────────────────────────────────

    public NextActionResponse getNextAction(String authHeader) {
        User user = getUserFromToken(authHeader);

        Optional<TransactionRecord> lastOpt = transactionRepository.findTopByUserOrderByTimestampDesc(user);

        TransactionType suggestedType = TransactionType.GIRIS;
        NextActionResponse.LastTransactionInfo lastInfo = null;

        if (lastOpt.isPresent()) {
            TransactionRecord last = lastOpt.get();
            suggestedType = (last.getType() == TransactionType.GIRIS) ? TransactionType.CIKIS : TransactionType.GIRIS;

            lastInfo = NextActionResponse.LastTransactionInfo.builder()
                    .type(last.getType())
                    .timestamp(last.getTimestamp())
                    .locationName(last.getLocation() != null ? last.getLocation().getName() : null)
                    .build();
        }

        NextActionResponse.ShiftInfo shiftInfo = null;
        if (user.getShift() != null) {
            Shift shift = user.getShift();
            DateTimeFormatter hmFormatter = DateTimeFormatter.ofPattern("HH:mm");
            shiftInfo = NextActionResponse.ShiftInfo.builder()
                    .name(shift.getName())
                    .startTime(shift.getStartTime().format(hmFormatter))
                    .endTime(shift.getEndTime().format(hmFormatter))
                    .build();
        }

        return NextActionResponse.builder()
                .suggestedType(suggestedType)
                .lastTransaction(lastInfo)
                .shift(shiftInfo)
                .build();
    }

    // ─── Yeni Hareket Ekle (Log) ──────────────────────────────────────────────

    public TransactionLogResponse logTransaction(String authHeader, TransactionLogRequest request) {
        User user = getUserFromToken(authHeader);

        // 1. Cihaz eşleşme kontrolü (403 DEVICE_MISMATCH)
        Device device = deviceRepository.findByUser(user)
                .orElseThrow(DeviceMismatchException::new);
        if (!device.getDeviceId().equals(request.getDeviceId())) {
            throw new DeviceMismatchException();
        }

        Optional<TransactionRecord> lastOpt = transactionRepository.findTopByUserOrderByTimestampDesc(user);

        // 2. Type boş ise otomatik belirleme
        TransactionType finalType = request.getType();
        if (finalType == null) {
            if (lastOpt.isPresent() && lastOpt.get().getType() == TransactionType.GIRIS) {
                finalType = TransactionType.CIKIS;
            } else {
                finalType = TransactionType.GIRIS;
            }
        }

        // 3. Timestamp boş ise sunucu saati
        LocalDateTime finalTimestamp = request.getTimestamp();
        if (finalTimestamp == null) {
            finalTimestamp = LocalDateTime.now();
        }

        // 4. QR parse ve konumu bağlama
        Location location = null;
        if (request.getQrContent() != null && !request.getQrContent().trim().isEmpty()) {
            // Format: PDKS:{firmId}:{locationCode}
            String[] parts = request.getQrContent().split(":");
            if (parts.length != 3 || !"PDKS".equals(parts[0])) {
                throw new InvalidQrException();
            }

            String qrFirmId = parts[1];
            String qrLocationCode = parts[2];

            // firmId eşleşmeli
            if (!user.getFirmId().equalsIgnoreCase(qrFirmId)) {
                throw new InvalidQrException();
            }

            // Location veritabanından bulunmalı
            location = locationRepository.findByFirmIdAndCode(user.getFirmId(), qrLocationCode)
                    .orElseThrow(InvalidQrException::new);
            
            if (!location.isActive()) {
                throw new InvalidQrException();
            }
        } else if (request.getMethod() == TransactionMethod.GPS) {
            List<Location> firmLocations = locationRepository.findByFirmId(user.getFirmId());
            for (Location loc : firmLocations) {
                if (loc.isActive() && loc.getLatitude() != null && loc.getLongitude() != null) {
                    double dist = GeoUtils.distanceMeters(
                            request.getLatitude(), request.getLongitude(),
                            loc.getLatitude(), loc.getLongitude()
                    );
                    int rad = loc.getRadiusMeters() != null ? loc.getRadiusMeters() : 100;
                    if (dist <= rad) {
                        location = loc;
                        break;
                    }
                }
            }
        }

        // 5. Geofence ve Anomali Kontrolü (Fraud Detection)
        fraudDetectionService.validateTransaction(user, request, location, lastOpt.orElse(null));

        // Kayıt oluştur
        TransactionRecord record = TransactionRecord.builder()
                .user(user)
                .type(finalType)
                .timestamp(finalTimestamp)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .qrContent(request.getQrContent())
                .location(location)
                .deviceId(request.getDeviceId())
                .method(request.getMethod())
                .build();

        TransactionRecord saved = transactionRepository.save(record);

        String message = (finalType == TransactionType.GIRIS)
                ? "Giriş kaydınız oluşturuldu"
                : "Çıkış kaydınız oluşturuldu";

        return TransactionLogResponse.builder()
                .id(saved.getId())
                .type(saved.getType())
                .timestamp(saved.getTimestamp())
                .locationName(location != null ? location.getName() : null)
                .message(message)
                .build();
    }

    // ─── Kullanıcı Geçmişi ───────────────────────────────────────────────────

    public Page<TransactionHistoryItem> getHistory(String authHeader, Pageable pageable) {
        User user = getUserFromToken(authHeader);

        Page<TransactionRecord> page = transactionRepository.findByUserOrderByTimestampDesc(user, pageable);

        return page.map(t -> TransactionHistoryItem.builder()
                .id(t.getId())
                .type(t.getType())
                .timestamp(t.getTimestamp())
                .locationName(t.getLocation() != null ? t.getLocation().getName() : null)
                .method(t.getMethod())
                .build());
    }

    // ─── Toplu Senkronizasyon (Sync) ─────────────────────────────────────────

    public java.util.List<SyncResultResponse> syncTransactions(String authHeader, java.util.List<TransactionLogRequest> requests) {
        User user = getUserFromToken(authHeader);

        // 1. Gelen diziyi timestamp'e göre ARTAN sırala (Ascending)
        requests.sort((r1, r2) -> {
            LocalDateTime t1 = r1.getTimestamp() != null ? r1.getTimestamp() : LocalDateTime.now();
            LocalDateTime t2 = r2.getTimestamp() != null ? r2.getTimestamp() : LocalDateTime.now();
            return t1.compareTo(t2);
        });

        java.util.List<SyncResultResponse> results = new java.util.ArrayList<>();

        for (TransactionLogRequest request : requests) {
            try {
                // 1. Cihaz eşleşme kontrolü (403 DEVICE_MISMATCH)
                Device device = deviceRepository.findByUser(user)
                        .orElseThrow(DeviceMismatchException::new);
                if (!device.getDeviceId().equals(request.getDeviceId())) {
                    throw new DeviceMismatchException();
                }

                // 2. Idempotency kontrolü: Aynı user + deviceId + timestamp (saniye hassasiyetinde) ile kayıt var mı?
                LocalDateTime timestamp = request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now();
                LocalDateTime start = timestamp.withNano(0);
                LocalDateTime end = start.plusSeconds(1);

                Optional<TransactionRecord> duplicateOpt = transactionRepository
                        .findByUserAndDeviceIdAndTimestampBetween(user, request.getDeviceId(), start, end);

                if (duplicateOpt.isPresent()) {
                    results.add(SyncResultResponse.builder()
                            .clientId(request.getClientId())
                            .status("SAVED")
                            .transactionId(duplicateOpt.get().getId())
                            .build());
                    continue; // Zaten kayıtlı, sonraki isteğe geç
                }

                // Normal logTransaction mantığı:
                // 3. Type belirleme
                Optional<TransactionRecord> lastOpt = transactionRepository.findTopByUserOrderByTimestampDesc(user);
                TransactionType finalType = request.getType();
                if (finalType == null) {
                    if (lastOpt.isPresent() && lastOpt.get().getType() == TransactionType.GIRIS) {
                        finalType = TransactionType.CIKIS;
                    } else {
                        finalType = TransactionType.GIRIS;
                    }
                }

                // 4. QR parse
                Location location = null;
                if (request.getQrContent() != null && !request.getQrContent().trim().isEmpty()) {
                    String[] parts = request.getQrContent().split(":");
                    if (parts.length != 3 || !"PDKS".equals(parts[0])) {
                        throw new InvalidQrException();
                    }
                    String qrFirmId = parts[1];
                    String qrLocationCode = parts[2];
                    if (!user.getFirmId().equalsIgnoreCase(qrFirmId)) {
                        throw new InvalidQrException();
                    }
                    location = locationRepository.findByFirmIdAndCode(user.getFirmId(), qrLocationCode)
                            .orElseThrow(InvalidQrException::new);
                    
                    if (!location.isActive()) {
                        throw new InvalidQrException();
                    }
                } else if (request.getMethod() == TransactionMethod.GPS) {
                    List<Location> firmLocations = locationRepository.findByFirmId(user.getFirmId());
                    for (Location loc : firmLocations) {
                        if (loc.isActive() && loc.getLatitude() != null && loc.getLongitude() != null) {
                            double dist = GeoUtils.distanceMeters(
                                    request.getLatitude(), request.getLongitude(),
                                    loc.getLatitude(), loc.getLongitude()
                            );
                            int rad = loc.getRadiusMeters() != null ? loc.getRadiusMeters() : 100;
                            if (dist <= rad) {
                                location = loc;
                                break;
                            }
                        }
                    }
                }

                // 5. Fraud
                fraudDetectionService.validateTransaction(user, request, location, lastOpt.orElse(null));

                // Kayıt oluştur
                TransactionRecord record = TransactionRecord.builder()
                        .user(user)
                        .type(finalType)
                        .timestamp(timestamp)
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .qrContent(request.getQrContent())
                        .location(location)
                        .deviceId(request.getDeviceId())
                        .method(request.getMethod())
                        .build();

                TransactionRecord saved = transactionRepository.save(record);

                results.add(SyncResultResponse.builder()
                        .clientId(request.getClientId())
                        .status("SAVED")
                        .transactionId(saved.getId())
                        .build());

            } catch (DeviceMismatchException ex) {
                results.add(SyncResultResponse.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode("DEVICE_MISMATCH")
                        .build());
            } catch (InvalidQrException ex) {
                results.add(SyncResultResponse.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode("INVALID_QR")
                        .build());
            } catch (com.pdks.backend.exception.LocationSuspiciousException ex) {
                results.add(SyncResultResponse.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode("LOCATION_SUSPICIOUS")
                        .build());
            } catch (Exception ex) {
                results.add(SyncResultResponse.builder()
                        .clientId(request.getClientId())
                        .status("REJECTED")
                        .errorCode("SYSTEM_ERROR")
                        .build());
            }
        }

        return results;
    }

    // ─── Yardımcı ────────────────────────────────────────────────────────────

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadı");
        }
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;

        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı"));
    }
}
