package com.pdks.backend.controller;

import com.pdks.backend.dto.DailyReportResponse;
import com.pdks.backend.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping("/daily")
    public ResponseEntity<List<DailyReportResponse>> getDailyReport(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(adminReportService.getDailyReport(authHeader, date, employeeId, departmentId));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<com.pdks.backend.dto.MonthlyReportResponse>> getMonthlyReport(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(adminReportService.getMonthlyReport(authHeader, year, month, employeeId, departmentId));
    }

    @GetMapping("/monthly/by-department")
    public ResponseEntity<List<com.pdks.backend.dto.DepartmentMonthlySummaryResponse>> getMonthlyReportByDepartment(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(adminReportService.getMonthlyReportByDepartment(authHeader, year, month));
    }

    @GetMapping("/monthly/detail")
    public ResponseEntity<List<DailyReportResponse>> getMonthlyReportDetail(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(adminReportService.getMonthlyReportDetail(authHeader, year, month, employeeId));
    }
}
