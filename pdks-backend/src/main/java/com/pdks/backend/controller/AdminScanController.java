package com.pdks.backend.controller;

import com.pdks.backend.dto.AdminScanResponse;
import com.pdks.backend.dto.ManualScanRequest;
import com.pdks.backend.service.AdminScanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/scans")
@RequiredArgsConstructor
public class AdminScanController {

    private final AdminScanService adminScanService;

    @PostMapping("/manual")
    public ResponseEntity<AdminScanResponse> createManualScan(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @Valid @RequestBody ManualScanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminScanService.createManualScan(authHeader, request));
    }

    @GetMapping
    public ResponseEntity<List<AdminScanResponse>> getScans(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Boolean suspiciousOnly) {
        return ResponseEntity.ok(adminScanService.getScans(authHeader, employeeId, startDate, endDate, suspiciousOnly));
    }
}
