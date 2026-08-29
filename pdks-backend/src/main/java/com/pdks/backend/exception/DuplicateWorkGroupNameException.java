package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateWorkGroupNameException extends RuntimeException {

    public DuplicateWorkGroupNameException(String name) {
        super("Bu isimde aktif bir çalışma grubu firmada zaten mevcut: " + name);
    }
}
