package com.pdks.backend.service;

import com.pdks.backend.dto.admin.*;
import com.pdks.backend.entity.*;
import com.pdks.backend.repository.*;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final TransactionRecordRepository transactionRepository;
    private final SuspiciousAttemptRepository suspiciousAttemptRepository;
    private final LocationRepository locationRepository;
    private final ShiftRepository shiftRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final DeletedTransactionLogRepository deletedTransactionLogRepository;

    // ─── Dashboard Stats ──────────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats(String authHeader) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        ZoneId turkeyZone = ZoneId.of("Europe/Istanbul");
        LocalDate todayTurkey = LocalDate.now(turkeyZone);
        LocalDateTime startOfToday = todayTurkey.atStartOfDay();
        LocalDateTime endOfToday = todayTurkey.atTime(23, 59, 59, 999999999);

        long todayEntryCount = transactionRepository.countByFirmAndTypeAndTimestampBetween(
                firmId, TransactionType.GIRIS, startOfToday, endOfToday);

        long todayExitCount = transactionRepository.countByFirmAndTypeAndTimestampBetween(
                firmId, TransactionType.CIKIS, startOfToday, endOfToday);

        List<TransactionRecord> latestTxs = transactionRepository.findLatestTransactionsByFirm(firmId);
        long currentlyInsideCount = latestTxs.stream()
                .filter(tx -> tx.getType() == TransactionType.GIRIS && tx.getUser().isActive())
                .count();

        LocalDateTime sevenDaysAgo = LocalDateTime.now(turkeyZone).minusDays(7);
        long suspiciousAttemptCount = suspiciousAttemptRepository.countByFirmAndTimestampAfter(firmId, sevenDaysAgo);

        long totalActiveUsers = userRepository.countByFirmIdAndActiveTrue(firmId);

        return DashboardStatsResponse.builder()
                .todayEntryCount(todayEntryCount)
                .todayExitCount(todayExitCount)
                .currentlyInsideCount(currentlyInsideCount)
                .suspiciousAttemptCount(suspiciousAttemptCount)
                .totalActiveUsers(totalActiveUsers)
                .build();
    }

    // ─── User Management ──────────────────────────────────────────────────────

    public List<AdminUserItem> getUsers(String authHeader, String search) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.searchUsers(firmId, search.trim());
        } else {
            users = userRepository.findByFirmId(firmId);
        }

        List<Device> devices = deviceRepository.findByFirmId(firmId);
        Set<Long> userIdsWithDevices = devices.stream()
                .map(d -> d.getUser().getId())
                .collect(Collectors.toSet());

        return users.stream()
                .map(u -> AdminUserItem.builder()
                        .id(u.getId())
                        .firmId(u.getFirmId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .role(u.getRole().name())
                        .active(u.isActive())
                        .mustChangePassword(u.isMustChangePassword())
                        .hasDevice(userIdsWithDevices.contains(u.getId()))
                        .createdAt(u.getCreatedAt())
                        .shiftName(u.getShift() != null ? u.getShift().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }

    public AdminUserItem createUser(String authHeader, CreateUserRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        if (!request.getFirmId().equals(firmId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kendi firmanız dışındaki bir firmaya kullanıcı ekleyemezsiniz.");
        }

        userRepository.findByUsernameAndFirmId(request.getUsername(), firmId)
                .ifPresent(u -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Kullanıcı adı bu firma için zaten kullanımda.");
                });

        Role userRole = Role.EMPLOYEE;
        try {
            userRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            // Default to EMPLOYEE
        }

        User newUser = User.builder()
                .firmId(firmId)
                .username(request.getUsername().trim())
                .fullName(request.getFullName().trim())
                .password(passwordEncoder.encode(request.getInitialPassword()))
                .role(userRole)
                .mustChangePassword(true)
                .active(true)
                .build();

        User saved = userRepository.save(newUser);

        return AdminUserItem.builder()
                .id(saved.getId())
                .firmId(saved.getFirmId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .role(saved.getRole().name())
                .active(saved.isActive())
                .mustChangePassword(saved.isMustChangePassword())
                .hasDevice(false)
                .createdAt(saved.getCreatedAt())
                .shiftName(saved.getShift() != null ? saved.getShift().getName() : null)
                .build();
    }

    public void updateUserStatus(String authHeader, Long userId, boolean active) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!targetUser.getFirmId().equals(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcının durumunu değiştirme yetkiniz yok.");
        }

        targetUser.setActive(active);
        userRepository.save(targetUser);
    }

    // ─── Device List ──────────────────────────────────────────────────────────

    public List<AdminDeviceItem> getDevices(String authHeader) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<Device> devices = deviceRepository.findByFirmId(firmId);

        return devices.stream()
                .map(d -> AdminDeviceItem.builder()
                        .deviceId(d.getDeviceId())
                        .deviceName(d.getDeviceName())
                        .registeredAt(d.getRegisteredAt())
                        .username(d.getUser().getUsername())
                        .fullName(d.getUser().getFullName())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Transaction Logs ─────────────────────────────────────────────────────

    public Page<AdminTransactionItem> getTransactions(
            String authHeader, String username, String startDate, String endDate, Pageable pageable
    ) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        LocalDateTime start = null;
        LocalDateTime end = null;

        if (startDate != null && !startDate.trim().isEmpty()) {
            start = LocalDate.parse(startDate.trim()).atStartOfDay();
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            end = LocalDate.parse(endDate.trim()).atTime(23, 59, 59, 999999999);
        }

        String searchUser = (username != null && !username.trim().isEmpty()) ? username.trim() : null;

        Page<TransactionRecord> transactions = transactionRepository.filterTransactions(
                firmId, searchUser, start, end, pageable);

        return transactions.map(t -> AdminTransactionItem.builder()
                .id(t.getId())
                .username(t.getUser().getUsername())
                .fullName(t.getUser().getFullName())
                .type(t.getType().name())
                .timestamp(t.getTimestamp())
                .locationName(t.getLocation() != null ? t.getLocation().getName() : "Konum: Kaydedildi")
                .method(t.getMethod().name())
                .latitude(t.getLatitude())
                .longitude(t.getLongitude())
                .manual(t.isManual())
                .manualNote(t.getManualNote())
                .build());
    }

    // ─── Suspicious Attempts ──────────────────────────────────────────────────

    public Page<SuspiciousAttemptItem> getSuspiciousAttempts(String authHeader, Pageable pageable) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Page<SuspiciousAttempt> attempts = suspiciousAttemptRepository.findByFirmIdOrderByTimestampDesc(firmId, pageable);

        return attempts.map(sa -> SuspiciousAttemptItem.builder()
                .id(sa.getId())
                .username(sa.getUser().getUsername())
                .fullName(sa.getUser().getFullName())
                .timestamp(sa.getTimestamp())
                .latitude(sa.getLatitude())
                .longitude(sa.getLongitude())
                .reason(sa.getReason().name())
                .deviceId(sa.getDeviceId())
                .build());
    }

    // ─── Locations ────────────────────────────────────────────────────────────

    public List<LocationItem> getLocations(String authHeader) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        List<Location> locations = locationRepository.findByFirmId(firmId);

        return locations.stream()
                .map(l -> LocationItem.builder()
                        .id(l.getId())
                        .firmId(l.getFirmId())
                        .code(l.getCode())
                        .name(l.getName())
                        .latitude(l.getLatitude())
                        .longitude(l.getLongitude())
                        .radiusMeters(l.getRadiusMeters())
                        .active(l.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    public LocationItem createLocation(String authHeader, CreateLocationRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        locationRepository.findByFirmIdAndCode(firmId, request.getCode().trim())
                .ifPresent(l -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu kod ile bir konum zaten mevcut.");
                });

        Location location = Location.builder()
                .firmId(firmId)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusMeters(request.getRadiusMeters())
                .active(true)
                .build();

        Location saved = locationRepository.save(location);

        return LocationItem.builder()
                .id(saved.getId())
                .firmId(saved.getFirmId())
                .code(saved.getCode())
                .name(saved.getName())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .radiusMeters(saved.getRadiusMeters())
                .active(saved.isActive())
                .build();
    }

    public LocationItem updateLocation(String authHeader, Long id, UpdateLocationRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konum bulunamadı."));

        if (!location.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu konumu güncellemeye yetkiniz yok.");
        }

        String newCode = request.getCode().trim();
        if (!location.getCode().equalsIgnoreCase(newCode)) {
            locationRepository.findByFirmIdAndCode(firmId, newCode)
                    .ifPresent(l -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu kod ile bir konum zaten mevcut.");
                    });
        }

        location.setCode(newCode);
        location.setName(request.getName().trim());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setRadiusMeters(request.getRadiusMeters());

        Location saved = locationRepository.save(location);

        return LocationItem.builder()
                .id(saved.getId())
                .firmId(saved.getFirmId())
                .code(saved.getCode())
                .name(saved.getName())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .radiusMeters(saved.getRadiusMeters())
                .active(saved.isActive())
                .build();
    }

    public void updateLocationStatus(String authHeader, Long id, boolean active) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konum bulunamadı."));

        if (!location.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu konumun durumunu güncellemeye yetkiniz yok.");
        }

        location.setActive(active);
        locationRepository.save(location);
    }

    public AdminUserItem updateUser(String authHeader, Long id, UpdateUserRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!user.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcıyı güncellemeye yetkiniz yok.");
        }

        user.setFullName(request.getFullName().trim());
        User saved = userRepository.save(user);

        boolean hasDevice = deviceRepository.existsByUser(saved);

        return AdminUserItem.builder()
                .id(saved.getId())
                .firmId(saved.getFirmId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .role(saved.getRole().name())
                .active(saved.isActive())
                .mustChangePassword(saved.isMustChangePassword())
                .hasDevice(hasDevice)
                .createdAt(saved.getCreatedAt())
                .shiftName(saved.getShift() != null ? saved.getShift().getName() : null)
                .build();
    }

    public void resetPassword(String authHeader, Long id, ResetPasswordRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!user.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcının şifresini sıfırlamaya yetkiniz yok.");
        }

        if (request.getNewPassword() == null || !request.getNewPassword().matches("^(?=.*[0-9]).{8,}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Şifre en az 8 karakter olmalı ve en az 1 rakam içermelidir");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(true);
        userRepository.save(user);
    }

    public byte[] exportTransactionsCsv(String authHeader, String username, String startDate, String endDate) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        LocalDateTime start = null;
        LocalDateTime end = null;

        if (startDate != null && !startDate.trim().isEmpty()) {
            start = LocalDate.parse(startDate.trim()).atStartOfDay();
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            end = LocalDate.parse(endDate.trim()).atTime(23, 59, 59, 999999999);
        }

        String searchUser = (username != null && !username.trim().isEmpty()) ? username.trim() : null;

        List<TransactionRecord> transactions = transactionRepository.filterTransactionsAll(
                firmId, searchUser, start, end);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Write UTF-8 BOM
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

            try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
                // Header row
                writer.println("Tarih,Saat,Personel,KullaniciAdi,Tip,Lokasyon,Enlem,Boylam,Yontem");

                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

                for (TransactionRecord t : transactions) {
                    String dateStr = t.getTimestamp() != null ? t.getTimestamp().format(dateFormatter) : "-";
                    String timeStr = t.getTimestamp() != null ? t.getTimestamp().format(timeFormatter) : "-";
                    String fullName = t.getUser().getFullName() != null ? t.getUser().getFullName() : "";
                    String uName = t.getUser().getUsername() != null ? t.getUser().getUsername() : "";
                    String type = t.getType() != null ? t.getType().name() : "";
                    String locationName = t.getLocation() != null ? t.getLocation().getName() : "Konum: Kaydedildi";
                    String lat = t.getLatitude() != null ? String.valueOf(t.getLatitude()) : "";
                    String lon = t.getLongitude() != null ? String.valueOf(t.getLongitude()) : "";
                    String method = t.getMethod() != null ? t.getMethod().name() : "";

                    writer.println(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                            escapeCsv(dateStr),
                            escapeCsv(timeStr),
                            escapeCsv(fullName),
                            escapeCsv(uName),
                            escapeCsv(type),
                            escapeCsv(locationName),
                            escapeCsv(lat),
                            escapeCsv(lon),
                            escapeCsv(method)
                    ));
                }
                writer.flush();
            }
            return baos.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "CSV oluşturulurken hata oluştu.", e);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }

    // ─── Yardımcı ────────────────────────────────────────────────────────────

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadı.");
        }
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;

        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı."));
    }

    // ─── Shift Management ──────────────────────────────────────────────────────

    public List<Shift> getShifts(String authHeader) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();
        return shiftRepository.findByFirmId(firmId);
    }

    public Shift createShift(String authHeader, ShiftRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        java.time.LocalTime start = java.time.LocalTime.parse(request.getStartTime().trim());
        java.time.LocalTime end = java.time.LocalTime.parse(request.getEndTime().trim());

        Shift shift = Shift.builder()
                .firmId(firmId)
                .name(request.getName().trim())
                .startTime(start)
                .endTime(end)
                .breakMinutes(request.getBreakMinutes())
                .lateToleranceMinutes(request.getLateToleranceMinutes())
                .active(true)
                .build();

        return shiftRepository.save(shift);
    }

    public Shift updateShift(String authHeader, Long id, ShiftRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));

        if (!shift.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu vardiyayı güncellemeye yetkiniz yok.");
        }

        java.time.LocalTime start = java.time.LocalTime.parse(request.getStartTime().trim());
        java.time.LocalTime end = java.time.LocalTime.parse(request.getEndTime().trim());

        shift.setName(request.getName().trim());
        shift.setStartTime(start);
        shift.setEndTime(end);
        shift.setBreakMinutes(request.getBreakMinutes());
        shift.setLateToleranceMinutes(request.getLateToleranceMinutes());

        return shiftRepository.save(shift);
    }

    public void updateShiftStatus(String authHeader, Long id, boolean active) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));

        if (!shift.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu vardiyanın durumunu güncellemeye yetkiniz yok.");
        }

        shift.setActive(active);
        shiftRepository.save(shift);
    }

    public AdminUserItem assignShiftToUser(String authHeader, Long userId, Long shiftId) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!targetUser.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcıya vardiya atama yetkiniz yok.");
        }

        if (shiftId != null) {
            Shift shift = shiftRepository.findById(shiftId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));
            if (!shift.getFirmId().equalsIgnoreCase(firmId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu vardiyayı atama yetkiniz yok.");
            }
            targetUser.setShift(shift);
        } else {
            targetUser.setShift(null);
        }

        User saved = userRepository.save(targetUser);
        boolean hasDevice = deviceRepository.existsByUser(saved);

        return AdminUserItem.builder()
                .id(saved.getId())
                .firmId(saved.getFirmId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .role(saved.getRole().name())
                .active(saved.isActive())
                .mustChangePassword(saved.isMustChangePassword())
                .hasDevice(hasDevice)
                .createdAt(saved.getCreatedAt())
                .shiftName(saved.getShift() != null ? saved.getShift().getName() : null)
                .build();
    }

    public AdminTransactionItem createManualTransaction(String authHeader, ManualTransactionRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı."));

        if (!targetUser.getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kullanıcının verilerini değiştirmeye yetkiniz yok.");
        }

        TransactionType type = TransactionType.valueOf(request.getType().toUpperCase());
        
        // Handle ISO-8601 formatting variation safely (with or without seconds/offset)
        String tsStr = request.getTimestamp().trim();
        if (tsStr.contains(" ")) {
            tsStr = tsStr.replace(" ", "T");
        }
        LocalDateTime timestamp = LocalDateTime.parse(tsStr);

        TransactionRecord record = TransactionRecord.builder()
                .user(targetUser)
                .type(type)
                .timestamp(timestamp)
                .latitude(0.0)
                .longitude(0.0)
                .deviceId("MANUAL-ENTRY")
                .method(TransactionMethod.MANUAL)
                .manual(true)
                .manualNote(request.getNote().trim())
                .build();

        TransactionRecord saved = transactionRepository.save(record);

        return AdminTransactionItem.builder()
                .id(saved.getId())
                .username(saved.getUser().getUsername())
                .fullName(saved.getUser().getFullName())
                .type(saved.getType().name())
                .timestamp(saved.getTimestamp())
                .locationName("Manuel Kayıt")
                .method(saved.getMethod().name())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .manual(saved.isManual())
                .manualNote(saved.getManualNote())
                .build();
    }

    public void deleteTransaction(String authHeader, Long transactionId, DeleteTransactionRequest request) {
        User admin = getUserFromToken(authHeader);
        String firmId = admin.getFirmId();

        TransactionRecord record = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kayıt bulunamadı."));

        // Firm isolation — admin can only delete records of their own firm's users
        if (!record.getUser().getFirmId().equalsIgnoreCase(firmId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu kaydı silmeye yetkiniz yok.");
        }

        // Write audit trail log before deletion
        DeletedTransactionLog logRecord = DeletedTransactionLog.builder()
                .originalTransactionId(record.getId())
                .username(record.getUser().getUsername())
                .type(record.getType())
                .timestamp(record.getTimestamp())
                .latitude(record.getLatitude())
                .longitude(record.getLongitude())
                .method(record.getMethod())
                .deletedBy(admin.getUsername())
                .reason(request.getReason())
                .build();
        deletedTransactionLogRepository.save(logRecord);

        transactionRepository.delete(record);
    }
}
