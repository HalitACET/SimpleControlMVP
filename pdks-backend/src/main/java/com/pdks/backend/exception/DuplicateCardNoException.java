package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Aynı firmada aktif bir personelin kart numarasıyla kayıt açılmaya çalışıldığında fırlatılır.
 * @RestControllerAdvice tarafından yakalanır ve {"message":..., "errorCode":"DUPLICATE_CARD_NO"} olarak dönülür.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateCardNoException extends RuntimeException {

    public DuplicateCardNoException(String cardNo) {
        super("Bu kart numarası firmada zaten aktif bir personele atanmış: " + cardNo);
    }
}
