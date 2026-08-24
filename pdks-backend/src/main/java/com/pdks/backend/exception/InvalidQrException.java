package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Geçersiz QR kod durumunda fırlatılır.
 * GlobalExceptionHandler tarafından yakalanıp errorCode: INVALID_QR ile dönülür.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidQrException extends RuntimeException {
    public InvalidQrException() {
        super("Geçersiz QR kod");
    }
}
