package com.pdks.backend.controller;

import com.pdks.backend.dto.BatchScanResult;
import com.pdks.backend.dto.ScanRequest;
import com.pdks.backend.dto.ScanResponse;
import com.pdks.backend.service.ScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/scans")
@RequiredArgsConstructor
public class ScanController {

    private final ScanService scanService;

    @PostMapping
    public ResponseEntity<ScanResponse> logScan(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody ScanRequest request) {
        ScanResponse response = scanService.logScan(authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<BatchScanResult>> syncScans(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody List<ScanRequest> requests) {
        return ResponseEntity.ok(scanService.syncScans(authHeader, requests));
    }

}
