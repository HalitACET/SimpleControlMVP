package com.pdks.backend.service;

import com.pdks.backend.dto.ChangePasswordRequest;
import com.pdks.backend.dto.LoginRequest;
import com.pdks.backend.dto.LoginResponse;
import com.pdks.backend.entity.Device;
import com.pdks.backend.entity.Role;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DeviceMismatchException;
import com.pdks.backend.repository.DeviceRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Kimlik doğrulama iş mantığı.
 * Controller buraya delege eder — iş mantığı controller'a yazılmaz.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * firmId + username + deviceId ile giriş.
     * Şifre doğrulandıktan SONRA, token üretilmeden ÖNCE cihaz kontrolü yapılır:
     *
     * 1. Kayıtlı cihaz YOK → login başarılı, deviceRegistered=false (mobil kayıt yapacak)
     * 2. Kayıtlı cihaz VAR ve deviceId EŞLEŞİYOR → normal login, deviceRegistered=true
     * 3. Kayıtlı cihaz VAR ama deviceId FARKLIYSA → 403 DEVICE_MISMATCH
     */
    public LoginResponse login(LoginRequest request) {
        // Kullanıcıyı firmId + username ikilisiyle ara
        User user = userRepository
                .findByUsernameAndFirmId(request.getUsername(), request.getFirmId())
                .orElseThrow(this::unauthorized);

        // Pasif kullanıcı — aynı hata mesajı, bilgi sızdırma önlenir
        if (!user.isActive()) {
            throw unauthorized();
        }

        // BCrypt şifre doğrulaması
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw unauthorized();
        }

        // ─── Rol ve Cihaz Kontrolleri ───────────────────
        boolean deviceRegistered = false;

        if (user.getRole() == Role.ADMIN || "ADMIN-PANEL".equals(request.getDeviceId())) {
            // Admin veya admin paneli (ADMIN-PANEL) üzerinden giriş yapıldığında cihaz doğrulaması yapılmaz
            deviceRegistered = (user.getRole() == Role.ADMIN);
        } else {
            Optional<Device> registeredDevice = deviceRepository.findByUser(user);
            if (registeredDevice.isEmpty()) {
                // Durum 1: Henüz kayıtlı cihaz yok — mobil /device/register çağıracak
                deviceRegistered = false;
            } else {
                Device device = registeredDevice.get();
                if (device.getDeviceId().equals(request.getDeviceId())) {
                    // Durum 2: Cihaz eşleşiyor — normal login
                    deviceRegistered = true;
                } else {
                    // Durum 3: Farklı cihaz — DEVICE_MISMATCH exception fırlat
                    throw new DeviceMismatchException();
                }
            }
        }

        // JWT üret ve yanıtı oluştur
        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .fullName(user.getFullName())
                .role(user.getRole())
                .mustChangePassword(user.isMustChangePassword())
                .deviceRegistered(deviceRegistered)
                .build();
    }

    // ─── Şifre Değiştirme ────────────────────────────────────────────────────

    /**
     * JWT'den userId'yi alır, eski şifreyi doğrular,
     * yeni şifreyi BCrypt'le hashler ve mustChangePassword'ü false yapar.
     *
     * @param token   "Bearer ..." kısmı çıkarılmış ham token
     * @param request oldPassword + newPassword
     */
    public void changePassword(String token, ChangePasswordRequest request) {
        Long userId = jwtService.extractUserId(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı"));

        // Eski şifre doğrulaması
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mevcut şifre hatalı");
        }

        // Yeni şifreyi hashle ve kaydet
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    // ─── Yardımcı Metotlar ───────────────────────────────────────────────────

    /** Güvenli hata — hangi alanın hatalı olduğunu belli etmez */
    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı adı veya şifre hatalı");
    }
}
