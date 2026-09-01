package com.pdks.backend.controller;

import com.pdks.backend.dto.*;
import com.pdks.backend.entity.User;
import com.pdks.backend.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Kullanıcı hesabı yönetim controller'ı — Faz 5.
 *
 * /admin/users-v2 yolunda kuruldu. Mevcut /admin/users (1. projeden) dokunulmadı.
 *
 * Kapsam: sadece EMPLOYEE rolündeki hesaplar yönetilir.
 * ADMIN hesabı bu endpoint'ler üzerinden oluşturulamaz, değiştirilemez.
 */
@RestController
@RequestMapping("/admin/users-v2")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    /**
     * GET /admin/users-v2
     * Firmanın tüm EMPLOYEE rolündeki kullanıcılarını listeler.
     * ADMIN hesapları listede yer almaz.
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userManagementService.listUsers(currentUser.getFirmId()));
    }

    /**
     * POST /admin/users-v2
     * Yeni EMPLOYEE hesabı oluşturur.
     * Rol istekte bulunmaz — sunucu her zaman EMPLOYEE atar.
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UserCreateRequest request
    ) {
        UserResponse response = userManagementService.createUser(currentUser.getFirmId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /admin/users-v2/{id}/status
     * Kullanıcıyı aktif veya pasif yapar.
     * ADMIN rolündeki kullanıcılar için 404 döner.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody UserStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(userManagementService.updateStatus(currentUser.getFirmId(), id, request));
    }

    /**
     * PUT /admin/users-v2/{id}/password
     * Kullanıcının şifresini sıfırlar, mustChangePassword=true yapılır.
     * ADMIN rolündeki kullanıcılar için 404 döner.
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<UserResponse> resetPassword(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody PasswordResetRequest request
    ) {
        return ResponseEntity.ok(userManagementService.resetPassword(currentUser.getFirmId(), id, request));
    }
}
