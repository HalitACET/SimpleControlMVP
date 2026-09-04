package com.pdks.backend.service;

import com.pdks.backend.dto.AdminScanResponse;
import com.pdks.backend.dto.ManualScanRequest;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.RawScan;
import com.pdks.backend.entity.TransactionMethod;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.RawScanRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminScanService {

    private final RawScanRepository rawScanRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AdminScanResponse createManualScan(String authHeader, ManualScanRequest request) {
        User admin = getUserFromToken(authHeader);

        if (request.getScannedAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ileri tarihli okutma girilemez.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadi."));

        if (!employee.getFirmId().equals(admin.getFirmId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Baska firmanin personeline islem yapamazsiniz.");
        }
        if (!employee.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pasif personele okutma girilemez.");
        }

        RawScan rawScan = RawScan.builder()
                .employee(employee)
                .deviceId("MANUAL")
                .scannedAt(request.getScannedAt())
                .latitude(null)
                .longitude(null)
                .mockLocation(null)
                .location(null)
                .method(TransactionMethod.MANUAL)
                .qrContent(null)
                .suspicious(false)
                .suspiciousReason(null)
                .clientId(null)
                .manualNote(request.getManualNote())
                .createdBy(admin.getUsername())
                .build();

        rawScan = rawScanRepository.save(rawScan);
        return mapToResponse(rawScan);
    }

    public AdminScanResponse excludeScan(String authHeader, Long id, com.pdks.backend.dto.ExcludeScanRequest request) {
        User admin = getUserFromToken(authHeader);
        RawScan scan = rawScanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Okutma bulunamadi."));

        if (!scan.getEmployee().getFirmId().equals(admin.getFirmId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Okutma bulunamadi.");
        }
        if (Boolean.TRUE.equals(scan.getExcluded())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Okutma zaten iptal edilmis.");
        }

        scan.setExcluded(true);
        scan.setExcludedReason(request.getReason());
        scan.setExcludedBy(admin.getUsername());
        scan.setExcludedAt(LocalDateTime.now());
        
        scan = rawScanRepository.save(scan);
        return mapToResponse(scan);
    }

    public AdminScanResponse includeScan(String authHeader, Long id) {
        User admin = getUserFromToken(authHeader);
        RawScan scan = rawScanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Okutma bulunamadi."));

        if (!scan.getEmployee().getFirmId().equals(admin.getFirmId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Okutma bulunamadi.");
        }
        if (!Boolean.TRUE.equals(scan.getExcluded())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Okutma iptal edilmemis.");
        }

        scan.setExcluded(false);
        scan.setExcludedReason(null);
        scan.setExcludedBy(null);
        scan.setExcludedAt(null);
        
        scan = rawScanRepository.save(scan);
        return mapToResponse(scan);
    }

    public List<AdminScanResponse> getScans(String authHeader, Long employeeId, LocalDate startDate, LocalDate endDate, Boolean suspiciousOnly, Long departmentId, Boolean excludedOnly) {
        User admin = getUserFromToken(authHeader);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<RawScan> scans = rawScanRepository.findAdminScans(admin.getFirmId(), start, end, employeeId, departmentId, suspiciousOnly, excludedOnly);
        return scans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private AdminScanResponse mapToResponse(RawScan scan) {
        return AdminScanResponse.builder()
                .id(scan.getId())
                .employeeId(scan.getEmployee().getId())
                .employeeName(scan.getEmployee().getFirstName() + " " + scan.getEmployee().getLastName())
                .scannedAt(scan.getScannedAt())
                .method(scan.getMethod())
                .locationName(scan.getLocation() != null ? scan.getLocation().getName() : null)
                .suspicious(scan.getSuspicious())
                .suspiciousReason(scan.getSuspiciousReason())
                .manualNote(scan.getManualNote())
                .createdBy(scan.getCreatedBy())
                .excluded(Boolean.TRUE.equals(scan.getExcluded()))
                .excludedReason(scan.getExcludedReason())
                .excludedBy(scan.getExcludedBy())
                .excludedAt(scan.getExcludedAt())
                .build();
    }

    private User getUserFromToken(String bearerToken) {
        if (bearerToken == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadi");
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }
}
