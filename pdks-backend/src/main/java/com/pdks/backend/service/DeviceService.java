package com.pdks.backend.service;

import com.pdks.backend.dto.DeviceListResponse;
import com.pdks.backend.dto.DeviceRegisterRequest;
import com.pdks.backend.dto.DeviceVerifyResponse;
import com.pdks.backend.entity.Device;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.DeviceRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Cihaz bağlama iş mantığı.
 */
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // ─── Cihaz Kaydı ─────────────────────────────────────────────────────────

    /**
     * POST /device/register
     * Token'daki kullanıcı için cihaz kaydeder.
     * Zaten kayıtlı cihaz varsa 409 döner.
     */
    public Device register(String token, DeviceRegisterRequest request) {
        User user = getUserFromToken(token);

        // Zaten kayıtlı cihaz kontrolü
        if (deviceRepository.existsByUser(user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu hesaba zaten bir cihaz kayıtlı");
        }

        Device device = Device.builder()
                .deviceId(request.getDeviceId())
                .deviceName(request.getDeviceName())
                .user(user)
                .active(true)
                .build();

        return deviceRepository.save(device);
    }

    // ─── Cihaz Doğrulama ─────────────────────────────────────────────────────

    /**
     * GET /device/verify
     * Header'daki X-Device-Id, token'daki kullanıcının kayıtlı cihazıyla eşleşiyor mu?
     */
    public DeviceVerifyResponse verify(String token, String deviceIdHeader) {
        User user = getUserFromToken(token);

        return deviceRepository.findByUser(user)
                .map(device -> DeviceVerifyResponse.builder()
                        .bound(device.getDeviceId().equals(deviceIdHeader))
                        .deviceName(device.getDeviceName())
                        .registeredAt(device.getRegisteredAt())
                        .build())
                .orElse(DeviceVerifyResponse.builder()
                        .bound(false)
                        .deviceName(null)
                        .registeredAt(null)
                        .build());
    }

    // ─── Cihaz Bağını Kaldırma (Admin) ───────────────────────────────────────

    /**
     * POST /admin/device-unbind
     * Belirtilen kullanıcının cihaz kaydını siler.
     * Sadece ADMIN rolüyle erişilebilir (SecurityConfig'de hasRole ile korunuyor).
     */
    public void unbind(String authHeader, String username) {
        String adminFirmId = getUserFromToken(authHeader).getFirmId();

        // 1. Önce firmamızda var mı diye bakalım
        User targetUser = userRepository.findByUsernameAndFirmId(username, adminFirmId).orElse(null);

        // 2. Kendi firmamızda yoksa, başka bir firmada olup olmadığını anlamak için Query By Example kullanalım
        if (targetUser == null) {
            User probe = new User();
            probe.setUsername(username);
            boolean existsAnywhere = !userRepository.findAll(org.springframework.data.domain.Example.of(probe)).isEmpty();
            
            if (existsAnywhere) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Baska firmanin kullanicisi.");
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı");
            }
        }

        Device device = deviceRepository.findByUser(targetUser)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Bu kullanıcıya ait kayıtlı cihaz bulunamadı"));

        deviceRepository.delete(device);
    }

    // ─── Cihaz Listesi (Admin) ───────────────────────────────────────────────

    /**
     * GET /admin/devices
     * Oturumdaki kullanıcının firmId'sine ait cihazları döner.
     */
    @Transactional(readOnly = true)
    public List<DeviceListResponse> getAllDevices(String authHeader) {
        String firmId = getUserFromToken(authHeader).getFirmId();
        return deviceRepository.findByFirmIdOrderByRegisteredAtDesc(firmId)
                .stream()
                .map(device -> DeviceListResponse.builder()
                        .id(device.getId())
                        .deviceId(device.getDeviceId())
                        .deviceName(device.getDeviceName())
                        .registeredAt(device.getRegisteredAt())
                        .active(device.isActive())
                        .userId(device.getUser().getId())
                        .username(device.getUser().getUsername())
                        .employeeName(device.getUser().getEmployee() != null 
                                ? device.getUser().getEmployee().getFirstName() + " " + device.getUser().getEmployee().getLastName() 
                                : null)
                        .cardNo(device.getUser().getEmployee() != null 
                                ? device.getUser().getEmployee().getCardNo() 
                                : null)
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Yardımcı ────────────────────────────────────────────────────────────

    private User getUserFromToken(String bearerToken) {
        // "Bearer " prefix'ini çıkar
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;

        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı"));
    }
}
