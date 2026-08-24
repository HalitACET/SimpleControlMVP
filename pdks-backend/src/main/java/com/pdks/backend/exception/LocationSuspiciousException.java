package com.pdks.backend.exception;

public class LocationSuspiciousException extends RuntimeException {
    public LocationSuspiciousException() {
        super("Konumunuz doğrulanamadı. Lütfen tesis alanında olduğunuzdan emin olup tekrar deneyin.");
    }
}
