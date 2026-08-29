package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ShiftInUseException extends RuntimeException {

    public ShiftInUseException(int groupCount) {
        super("Bu vardiya pasife alınamaz çünkü " + groupCount + " çalışma gününde kullanılıyor. Önce ilgili çalışma gruplarından kaldırın.");
    }
}
