package com.pdks.backend.service;

import com.pdks.backend.dto.EmployeeRequest;
import com.pdks.backend.dto.EmployeeResponse;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DuplicateCardNoException;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Personel yönetimi iş mantığı.
 * firmId her zaman JWT'den alınır — istemci belirleyemez.
 */
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // ─── Listeleme ────────────────────────────────────────────────────────────

    /** Firmanın aktif personellerini döner */
    public List<EmployeeResponse> listEmployees(String authHeader) {
        String firmId = extractFirmId(authHeader);
        return employeeRepository.findByFirmIdAndActiveTrue(firmId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Tek Kayıt ────────────────────────────────────────────────────────────

    /**
     * Personeli id ile getirir.
     * Başka firmanın personeli için 404 döner — varlığını bile belli etme.
     */
    public EmployeeResponse getEmployee(String authHeader, Long id) {
        String firmId = extractFirmId(authHeader);
        Employee employee = findOwnedEmployee(firmId, id);
        return toResponse(employee);
    }

    // ─── Oluşturma ────────────────────────────────────────────────────────────

    public EmployeeResponse createEmployee(String authHeader, EmployeeRequest request) {
        String firmId = extractFirmId(authHeader);

        // Kart numarası çakışma kontrolü
        employeeRepository.findByFirmIdAndCardNoAndActiveTrue(firmId, request.getCardNo().trim())
                .ifPresent(e -> { throw new DuplicateCardNoException(request.getCardNo().trim()); });

        Employee employee = Employee.builder()
                .firmId(firmId)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .cardNo(request.getCardNo().trim())
                .active(true)
                .build();

        return toResponse(employeeRepository.save(employee));
    }

    // ─── Güncelleme ───────────────────────────────────────────────────────────

    /**
     * firstName, lastName, cardNo güncellenebilir.
     * firmId, active, createdAt değişmez.
     */
    public EmployeeResponse updateEmployee(String authHeader, Long id, EmployeeRequest request) {
        String firmId = extractFirmId(authHeader);
        Employee employee = findOwnedEmployee(firmId, id);

        // Kart numarası değişiyorsa çakışma kontrolü
        String newCardNo = request.getCardNo().trim();
        if (!employee.getCardNo().equals(newCardNo)) {
            employeeRepository.findByFirmIdAndCardNoAndActiveTrue(firmId, newCardNo)
                    .ifPresent(e -> { throw new DuplicateCardNoException(newCardNo); });
        }

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setCardNo(newCardNo);

        return toResponse(employeeRepository.save(employee));
    }

    // ─── Silme (soft delete) ──────────────────────────────────────────────────

    /** Gerçek silme yapılmaz — active = false yapılır */
    public void deactivateEmployee(String authHeader, Long id) {
        String firmId = extractFirmId(authHeader);
        Employee employee = findOwnedEmployee(firmId, id);
        employee.setActive(false);
        employeeRepository.save(employee);
    }

    // ─── Yardımcı Metotlar ────────────────────────────────────────────────────

    private Employee findOwnedEmployee(String firmId, Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadı."));
        // Başka firmanın personelini 403 yerine 404 ile gizle
        if (!employee.getFirmId().equals(firmId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadı.");
        }
        return employee;
    }

    private String extractFirmId(String bearerToken) {
        if (bearerToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadı.");
        }
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;
        Long userId = jwtService.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı."));
        return user.getFirmId();
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .firmId(e.getFirmId())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .cardNo(e.getCardNo())
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
