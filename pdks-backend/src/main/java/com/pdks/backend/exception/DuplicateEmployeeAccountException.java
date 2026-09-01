package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Aynı personel için ikinci bir hesap açılmaya çalışıldığında fırlatılır.
 * Ham veritabanı kısıt hatası yerine bu mesaj dönülür.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateEmployeeAccountException extends RuntimeException {
    public DuplicateEmployeeAccountException() {
        super("Bu personelin zaten bir kullanıcı hesabı var");
    }
}
