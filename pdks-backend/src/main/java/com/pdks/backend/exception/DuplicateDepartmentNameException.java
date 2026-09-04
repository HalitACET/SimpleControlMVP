package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateDepartmentNameException extends RuntimeException {
    public DuplicateDepartmentNameException(String name) {
        super("'" + name + "' adında bir departman zaten mevcut");
    }
}
