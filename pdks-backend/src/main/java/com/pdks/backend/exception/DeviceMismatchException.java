package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Cihaz uyuşmazlığında fırlatılır.
 * @RestControllerAdvice tarafından yakalanır ve {"message":..., "errorCode":"DEVICE_MISMATCH"} olarak dönülür.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class DeviceMismatchException extends RuntimeException {

    public DeviceMismatchException() {
        super("Bu hesap başka bir cihaza kayıtlıdır. Lütfen İK birimine başvurun.");
    }
}
