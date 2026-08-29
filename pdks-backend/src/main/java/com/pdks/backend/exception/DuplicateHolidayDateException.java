package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDate;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateHolidayDateException extends RuntimeException {

    public DuplicateHolidayDateException(LocalDate date) {
        super("Bu firmada " + date.toString() + " tarihinde zaten bir tatil tanımlanmış.");
    }
}
