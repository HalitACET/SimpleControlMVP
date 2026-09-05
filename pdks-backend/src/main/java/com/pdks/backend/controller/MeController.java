package com.pdks.backend.controller;

import com.pdks.backend.dto.MeNextActionResponse;
import com.pdks.backend.dto.ScanHistoryItem;
import com.pdks.backend.dto.SummaryResponse;
import com.pdks.backend.service.MeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping("/next-action")
    public ResponseEntity<MeNextActionResponse> getNextAction(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return ResponseEntity.ok(meService.getNextAction(authHeader));
    }

    @GetMapping("/scans")
    public ResponseEntity<com.pdks.backend.dto.ScanHistoryPage> getScans(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (page < 0) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Sayfa numarasi negatif olamaz.");
        }
        if (size < 1) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Sayfa boyutu en az 1 olmalidir.");
        }
        if (size > 100) size = 100;
        return ResponseEntity.ok(meService.getScans(authHeader, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(meService.getSummary(authHeader, year, month));
    }
}
