package com.pdks.backend.controller;

import com.pdks.backend.dto.ChangePasswordRequest;
import com.pdks.backend.dto.LoginRequest;
import com.pdks.backend.dto.LoginResponse;
import com.pdks.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Kimlik doğrulama endpoint'leri.
 * İş mantığı AuthService'e delege edilir.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /auth/login
     * firmId + username + password ile giriş.
     * Başarısız durumda 401 döner — hangisinin hatalı olduğu belli edilmez.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /auth/change-password
     * Authorization header'daki JWT'den kullanıcıyı bulur,
     * eski şifreyi doğrular ve yeni şifreyi kaydeder.
     * Geçerli token yoksa 401 (SecurityConfig filtresi engeller).
     */
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        // "Bearer " prefix'ini çıkar
        String token = authHeader.substring(7);
        authService.changePassword(token, request);
        return ResponseEntity.ok().build();
    }
}
