package com.pdks.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tüm controller'lardan fırlayan exception'ları yakalar
 * ve tutarlı JSON formatında döner.
 *
 * Standart hata gövdesi:
 *   {"message": "...", "errorCode": "..."}  (errorCode opsiyonel)
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─── Cihaz Uyuşmazlığı ───────────────────────────────────────────────────

    /**
     * 403 DEVICE_MISMATCH — yalnızca bu exception için özel format
     */
    @ExceptionHandler(DeviceMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleDeviceMismatch(DeviceMismatchException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DEVICE_MISMATCH");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * 400 INVALID_QR — yalnızca bu exception için özel format
     */
    @ExceptionHandler(InvalidQrException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidQr(InvalidQrException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "INVALID_QR");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 403 LOCATION_SUSPICIOUS
     */
    @ExceptionHandler(LocationSuspiciousException.class)
    public ResponseEntity<Map<String, Object>> handleLocationSuspicious(LocationSuspiciousException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "LOCATION_SUSPICIOUS");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ─── ResponseStatusException (401, 409, 404 vb.) ─────────────────────────

    /**
     * Spring'in ResponseStatusException'ını JSON'a çevirir.
     * AuthService'teki unauthorized(), DeviceService'teki 409 ve 404'ler buraya düşer.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getReason() != null ? ex.getReason() : ex.getMessage());
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    // ─── Validasyon Hataları (@Valid) ─────────────────────────────────────────

    /**
     * @NotBlank / @Valid alanları hatalıysa tüm hataları listeler.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", errors);
        body.put("errorCode", "VALIDATION_ERROR");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // ─── Beklenmedik Hatalar ──────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Beklenmedik hata", ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Sunucu hatası oluştu.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
