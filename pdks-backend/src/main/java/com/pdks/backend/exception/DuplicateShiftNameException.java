package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateShiftNameException extends RuntimeException {

    public DuplicateShiftNameException(String name) {
        super("Bu isimde aktif bir vardiya firmada zaten mevcut: " + name);
    }
}
