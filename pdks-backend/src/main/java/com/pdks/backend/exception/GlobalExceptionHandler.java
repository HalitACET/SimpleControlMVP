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
     * 403 DEVICE_REQUIRED — EMPLOYEE deviceId göndermeden giriş yapmaya çalıştığında
     */
    @ExceptionHandler(DeviceRequiredException.class)
    public ResponseEntity<Map<String, Object>> handleDeviceRequired(DeviceRequiredException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DEVICE_REQUIRED");
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

    /**
     * 409 DUPLICATE_CARD_NO — aynı firmada aktif personelde kart numarası çakışması
     */
    @ExceptionHandler(DuplicateCardNoException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateCardNo(DuplicateCardNoException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_CARD_NO");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 DUPLICATE_USERNAME — aynı firmada kullanıcı adı çakışması
     */
    @ExceptionHandler(DuplicateUsernameException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateUsername(DuplicateUsernameException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_USERNAME");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 DUPLICATE_EMPLOYEE_ACCOUNT — aynı personele ikinci hesap açılmaya çalışıldığında
     */
    @ExceptionHandler(DuplicateEmployeeAccountException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateEmployeeAccount(DuplicateEmployeeAccountException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_EMPLOYEE_ACCOUNT");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(DuplicateDepartmentNameException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateDepartmentNameException(DuplicateDepartmentNameException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_DEPARTMENT_NAME");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(DepartmentHasEmployeesException.class)
    public ResponseEntity<Map<String, Object>> handleDepartmentHasEmployeesException(DepartmentHasEmployeesException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DEPARTMENT_HAS_EMPLOYEES");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 DUPLICATE_SHIFT_NAME
     */
    @ExceptionHandler(DuplicateShiftNameException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateShiftName(DuplicateShiftNameException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_SHIFT_NAME");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 SHIFT_IN_USE
     */
    @ExceptionHandler(ShiftInUseException.class)
    public ResponseEntity<Map<String, Object>> handleShiftInUse(ShiftInUseException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "SHIFT_IN_USE");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 DUPLICATE_WORK_GROUP_NAME
     */
    @ExceptionHandler(DuplicateWorkGroupNameException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateWorkGroupName(DuplicateWorkGroupNameException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_WORK_GROUP_NAME");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 WORK_GROUP_IN_USE
     */
    @ExceptionHandler(WorkGroupInUseException.class)
    public ResponseEntity<Map<String, Object>> handleWorkGroupInUse(WorkGroupInUseException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "WORK_GROUP_IN_USE");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 409 DUPLICATE_HOLIDAY_DATE
     */
    @ExceptionHandler(DuplicateHolidayDateException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateHolidayDate(DuplicateHolidayDateException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("errorCode", "DUPLICATE_HOLIDAY_DATE");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
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

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        log.debug("Bilinmeyen URL çağrısı: {}", ex.getMessage());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Kaynak bulunamadi.");
        body.put("errorCode", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Beklenmedik hata", ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Sunucu hatası oluştu.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
