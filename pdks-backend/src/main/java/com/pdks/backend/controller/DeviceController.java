package com.pdks.backend.controller;

import com.pdks.backend.dto.DeviceRegisterRequest;
import com.pdks.backend.dto.DeviceUnbindRequest;
import com.pdks.backend.dto.DeviceVerifyResponse;
import com.pdks.backend.entity.Device;
import com.pdks.backend.service.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cihaz bağlama endpoint'leri.
 *
 * POST /device/register   — JWT zorunlu, cihaz kaydet
 * GET  /device/verify     — JWT zorunlu, X-Device-Id header ile eşleşme kontrol et
 * POST /admin/device-unbind — JWT zorunlu + ADMIN rolü
 */
@RestController
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * POST /device/register
     * Token'daki kullanıcı için ilk kez cihaz kaydeder.
     * Zaten kayıtlı cihaz varsa 409 döner.
     */
    @PostMapping("/device/register")
    public ResponseEntity<Device> register(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody DeviceRegisterRequest request
    ) {
        Device saved = deviceService.register(authHeader, request);
        return ResponseEntity.ok(saved);
    }

    /**
     * GET /device/verify
     * X-Device-Id header'daki cihaz, token'daki kullanıcının kayıtlı cihazıyla eşleşiyor mu?
     */
    @GetMapping("/device/verify")
    public ResponseEntity<DeviceVerifyResponse> verify(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Device-Id") String deviceId
    ) {
        DeviceVerifyResponse response = deviceService.verify(authHeader, deviceId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /admin/device-unbind
     * Belirtilen kullanıcının cihaz kaydını siler.
     * Sadece ADMIN rolüyle erişilebilir.
     */
    @PostMapping("/admin/device-unbind")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unbind(
            @Valid @RequestBody DeviceUnbindRequest request
    ) {
        deviceService.unbind(request.getFirmId(), request.getUsername());
        return ResponseEntity.ok().build();
    }
}
