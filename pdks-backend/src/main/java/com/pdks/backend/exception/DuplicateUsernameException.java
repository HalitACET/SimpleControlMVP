package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Kullanıcı adı aynı firmada zaten kullanılıyorsa fırlatılır.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String username) {
        super("'" + username + "' kullanıcı adı bu firmada zaten kullanılıyor");
    }
}
