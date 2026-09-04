package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Kullanıcı adı (kart numarası) aynı firmada zaten kullanılıyorsa fırlatılır.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String username) {
        super("'" + username + "' giriş kimliği (kart numarası) bu firmada zaten başka bir hesap tarafından kullanılıyor");
    }
}
