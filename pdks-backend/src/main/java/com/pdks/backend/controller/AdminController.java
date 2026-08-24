package com.pdks.backend.controller;

import com.pdks.backend.dto.admin.*;
import com.pdks.backend.service.AdminService;
import com.pdks.backend.service.TimesheetService;
import com.pdks.backend.entity.Shift;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final TimesheetService timesheetService;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(adminService.getDashboardStats(authHeader));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserItem>> getUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(adminService.getUsers(authHeader, search));
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserItem> createUser(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody CreateUserRequest request
    ) {
        return ResponseEntity.ok(adminService.createUser(authHeader, request));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Void> updateUserStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        Boolean active = body.get("active");
        if (active == null) {
            active = false;
        }
        adminService.updateUserStatus(authHeader, id, active);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/devices")
    public ResponseEntity<List<AdminDeviceItem>> getDevices(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(adminService.getDevices(authHeader));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<AdminTransactionItem>> getTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getTransactions(authHeader, username, startDate, endDate, pageable));
    }

    @GetMapping("/suspicious-attempts")
    public ResponseEntity<Page<SuspiciousAttemptItem>> getSuspiciousAttempts(
            @RequestHeader("Authorization") String authHeader,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getSuspiciousAttempts(authHeader, pageable));
    }

    @GetMapping("/locations")
    public ResponseEntity<List<LocationItem>> getLocations(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(adminService.getLocations(authHeader));
    }

    @PostMapping("/locations")
    public ResponseEntity<LocationItem> createLocation(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody CreateLocationRequest request
    ) {
        return ResponseEntity.ok(adminService.createLocation(authHeader, request));
    }

    @PutMapping("/locations/{id}")
    public ResponseEntity<LocationItem> updateLocation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateLocationRequest request
    ) {
        return ResponseEntity.ok(adminService.updateLocation(authHeader, id, request));
    }

    @PutMapping("/locations/{id}/status")
    public ResponseEntity<Void> updateLocationStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateLocationStatusRequest request
    ) {
        adminService.updateLocationStatus(authHeader, id, request.getActive());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserItem> updateUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUser(authHeader, id, request));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        adminService.resetPassword(authHeader, id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> exportTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate
    ) {
        byte[] csvData = adminService.exportTransactionsCsv(authHeader, username, startDate, endDate);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "gecis-kayitlari.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    // ─── Shift Endpoints ──────────────────────────────────────────────────────

    @GetMapping("/shifts")
    public ResponseEntity<List<Shift>> getShifts(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(adminService.getShifts(authHeader));
    }

    @PostMapping("/shifts")
    public ResponseEntity<Shift> createShift(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ShiftRequest request
    ) {
        return ResponseEntity.ok(adminService.createShift(authHeader, request));
    }

    @PutMapping("/shifts/{id}")
    public ResponseEntity<Shift> updateShift(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody ShiftRequest request
    ) {
        return ResponseEntity.ok(adminService.updateShift(authHeader, id, request));
    }

    @PutMapping("/shifts/{id}/status")
    public ResponseEntity<Void> updateShiftStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateShiftStatusRequest request
    ) {
        adminService.updateShiftStatus(authHeader, id, request.getActive());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/shift")
    public ResponseEntity<AdminUserItem> assignShiftToUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long id,
            @Valid @RequestBody AssignShiftRequest request
    ) {
        return ResponseEntity.ok(adminService.assignShiftToUser(authHeader, id, request.getShiftId()));
    }

    // ─── Manual Transaction ───────────────────────────────────────────────────

    @PostMapping("/transactions/manual")
    public ResponseEntity<AdminTransactionItem> createManualTransaction(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ManualTransactionRequest request
    ) {
        return ResponseEntity.ok(adminService.createManualTransaction(authHeader, request));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody DeleteTransactionRequest request
    ) {
        adminService.deleteTransaction(authHeader, id, request);
        return ResponseEntity.noContent().build();
    }

    // ─── Timesheet Endpoints ──────────────────────────────────────────────────

    @GetMapping("/timesheet")
    public ResponseEntity<TimesheetResponse> getTimesheet(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("userId") Long userId,
            @RequestParam("year") Integer year,
            @RequestParam("month") Integer month
    ) {
        return ResponseEntity.ok(timesheetService.getTimesheet(authHeader, userId, year, month));
    }

    @GetMapping("/timesheet/export")
    public ResponseEntity<byte[]> exportTimesheet(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("userId") Long userId,
            @RequestParam("year") Integer year,
            @RequestParam("month") Integer month
    ) {
        byte[] csvData = timesheetService.exportTimesheetCsv(authHeader, userId, year, month);
        
        TimesheetResponse ts = timesheetService.getTimesheet(authHeader, userId, year, month);
        String filename = String.format("puantaj-%s-%d-%d.csv", ts.getUsername(), year, month);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}
