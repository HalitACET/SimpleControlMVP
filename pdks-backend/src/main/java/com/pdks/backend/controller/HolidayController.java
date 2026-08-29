package com.pdks.backend.controller;

import com.pdks.backend.dto.HolidayRequest;
import com.pdks.backend.dto.HolidayResponse;
import com.pdks.backend.service.HolidayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public ResponseEntity<List<HolidayResponse>> list(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(holidayService.listHolidays(authHeader, year));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HolidayResponse> getOne(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(holidayService.getHoliday(authHeader, id));
    }

    @PostMapping
    public ResponseEntity<HolidayResponse> create(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holidayService.createHoliday(authHeader, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HolidayResponse> update(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.ok(holidayService.updateHoliday(authHeader, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        holidayService.deleteHoliday(authHeader, id);
        return ResponseEntity.noContent().build();
    }
}
