package com.pdks.backend.controller;

import com.pdks.backend.dto.ShiftRequest;
import com.pdks.backend.dto.ShiftResponse;
import com.pdks.backend.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @GetMapping
    public ResponseEntity<List<ShiftResponse>> list(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(shiftService.listActiveShifts(authHeader));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftResponse> getOne(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getShift(authHeader, id));
    }

    @PostMapping
    public ResponseEntity<ShiftResponse> create(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ShiftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shiftService.createShift(authHeader, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftResponse> update(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody ShiftRequest request) {
        return ResponseEntity.ok(shiftService.updateShift(authHeader, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        shiftService.deleteShift(authHeader, id);
        return ResponseEntity.noContent().build();
    }
}
