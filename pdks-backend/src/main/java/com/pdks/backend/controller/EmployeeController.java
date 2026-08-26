package com.pdks.backend.controller;

import com.pdks.backend.dto.EmployeeRequest;
import com.pdks.backend.dto.EmployeeResponse;
import com.pdks.backend.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Personel CRUD endpoint'leri.
 * /admin/** güvenliği SecurityConfig'de hasRole("ADMIN") olarak tanımlı —
 * bu controller'a ek güvenlik anotasyonu eklenmiyor.
 */
@RestController
@RequestMapping("/admin/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    /** Firmanın aktif personellerini listeler */
    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> list(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(employeeService.listEmployees(authHeader));
    }

    /** Tek personeli id ile getirir */
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getOne(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(authHeader, id));
    }

    /** Yeni personel oluşturur */
    @PostMapping
    public ResponseEntity<EmployeeResponse> create(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(authHeader, request));
    }

    /** Personeli günceller (firstName, lastName, cardNo) */
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(authHeader, id, request));
    }

    /** Personeli pasife alır (soft delete) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        employeeService.deactivateEmployee(authHeader, id);
        return ResponseEntity.noContent().build();
    }
}
