package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DepartmentHasEmployeesException extends RuntimeException {
    public DepartmentHasEmployeesException(long count) {
        super("Bu departmana atanmış " + count + " aktif personel bulunduğu için silinemez");
    }
}
