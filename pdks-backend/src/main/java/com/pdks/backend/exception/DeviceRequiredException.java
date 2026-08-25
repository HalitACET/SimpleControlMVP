package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * EMPLOYEE rolündeki kullanıcı deviceId göndermeden giriş yapmaya çalışırsa fırlatılır.
 * @RestControllerAdvice tarafından yakalanır ve {"message":..., "errorCode":"DEVICE_REQUIRED"} olarak dönülür.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class DeviceRequiredException extends RuntimeException {

    public DeviceRequiredException() {
        super("Cihaz bilgisi zorunludur. Lütfen mobil uygulama üzerinden giriş yapın.");
    }
}
