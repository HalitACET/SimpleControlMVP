package com.pdks.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class WorkGroupInUseException extends RuntimeException {

    public WorkGroupInUseException(int employeeCount) {
        super("Bu çalışma grubu pasife alınamaz çünkü " + employeeCount + " aktif personele atanmış. Önce personellerden kaldırın.");
    }
}
