package com.pdks.backend.controller;

import com.pdks.backend.dto.MeNextActionResponse;
import com.pdks.backend.dto.ScanHistoryItem;
import com.pdks.backend.dto.SummaryResponse;
import com.pdks.backend.dto.DailyItemResponse;
import com.pdks.backend.service.MeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

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

    @GetMapping("/daily")
    public ResponseEntity<List<DailyItemResponse>> getDaily(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null || to == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tarih araligi zorunludur.");
        }
        if (from.isAfter(to)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Baslangic tarihi bitis tarihinden sonra olamaz.");
        }
        if (java.time.temporal.ChronoUnit.DAYS.between(from, to) > 31) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tarih araligi en fazla 31 gun olabilir.");
        }
        return ResponseEntity.ok(meService.getDaily(authHeader, from, to));
    }

    @GetMapping("/scans")
    public ResponseEntity<com.pdks.backend.dto.ScanHistoryPage> getScans(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (page < 0) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Sayfa numarasi negatif olamaz.");
        }
        if (size < 1) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Sayfa boyutu en az 1 olmalidir.");
        }
        if (size > 100) size = 100;
        
        if ((from == null && to != null) || (from != null && to == null)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tarih araligi icin from ve to birlikte verilmelidir.");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Baslangic tarihi bitis tarihinden sonra olamaz.");
        }
        
        return ResponseEntity.ok(meService.getScans(authHeader, page, size, from, to));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(meService.getSummary(authHeader, year, month));
    }
}
