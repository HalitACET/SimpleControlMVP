package com.pdks.backend.controller;

import com.pdks.backend.dto.*;
import com.pdks.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * GET /transaction/next-action
     * Kullanıcının son hareketine göre önereceği GIRIS/CIKIS tipini belirler.
     */
    @GetMapping("/next-action")
    public ResponseEntity<NextActionResponse> getNextAction(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(transactionService.getNextAction(authHeader));
    }

    /**
     * POST /transaction/log
     * GPS veya QR ile geçiş kaydı oluşturur.
     */
    @PostMapping("/log")
    public ResponseEntity<TransactionLogResponse> logTransaction(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody TransactionLogRequest request
    ) {
        return ResponseEntity.ok(transactionService.logTransaction(authHeader, request));
    }

    /**
     * GET /transaction/history
     * Kullanıcının kendi geçiş hareketlerini sayfalanmış olarak listeler.
     */
    @GetMapping("/history")
    public ResponseEntity<Page<TransactionHistoryItem>> getHistory(
            @RequestHeader("Authorization") String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(transactionService.getHistory(authHeader, pageable));
    }

    /**
     * POST /transaction/sync
     * Offline hareketleri topluca senkronize eder.
     */
    @PostMapping("/sync")
    public ResponseEntity<java.util.List<SyncResultResponse>> syncTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody java.util.List<TransactionLogRequest> requests
    ) {
        return ResponseEntity.ok(transactionService.syncTransactions(authHeader, requests));
    }
}
