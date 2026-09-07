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
    private final com.pdks.backend.repository.WorkGroupRepository workGroupRepository;
    private final com.pdks.backend.repository.DepartmentRepository departmentRepository;

    // ─── Listeleme ────────────────────────────────────────────────────────────

    /** Firmanın personellerini döner (includeInactive true ise pasifleri de dahil eder) */
    public List<EmployeeResponse> listEmployees(String authHeader, boolean includeInactive) {
        String firmId = extractFirmId(authHeader);
        
        List<Employee> employees = includeInactive 
                ? employeeRepository.findByFirmIdOrderByActiveDesc(firmId)
                : employeeRepository.findByFirmIdAndActiveTrue(firmId);
                
        if (employees.isEmpty()) {
            return List.of();
        }
        
        List<Long> employeeIds = employees.stream()
                .map(Employee::getId)
                .collect(Collectors.toList());
                
        // N+1 problemini önlemek için kullanıcıları tek sorguda çekiyoruz
        List<User> users = userRepository.findByFirmIdAndEmployeeIdIn(firmId, employeeIds);
        java.util.Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(u -> u.getEmployee().getId(), u -> u));
                
        return employees.stream()
                .map(e -> toResponse(e, userMap.get(e.getId())))
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
        User user = userRepository.findByEmployeeId(employee.getId()).orElse(null);
        return toResponse(employee, user);
    }

    // ─── Oluşturma ────────────────────────────────────────────────────────────

    public EmployeeResponse createEmployee(String authHeader, EmployeeRequest request) {
        String firmId = extractFirmId(authHeader);

        // Kart numarası çakışma kontrolü
        employeeRepository.findByFirmIdAndCardNoAndActiveTrue(firmId, request.getCardNo().trim())
                .ifPresent(e -> { throw new DuplicateCardNoException(request.getCardNo().trim()); });

        com.pdks.backend.entity.WorkGroup workGroup = null;
        if (request.getWorkGroupId() != null) {
            workGroup = workGroupRepository.findByFirmIdAndIdAndActiveTrue(firmId, request.getWorkGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz veya pasif çalışma grubu ID: " + request.getWorkGroupId()));
        }

        com.pdks.backend.entity.Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findByIdAndFirmIdAndActiveTrue(request.getDepartmentId(), firmId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz veya pasif departman ID: " + request.getDepartmentId()));
        }

        Employee employee = Employee.builder()
                .firmId(firmId)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .cardNo(request.getCardNo().trim())
                .workGroup(workGroup)
                .department(department)
                .active(true)
                .build();

        return toResponse(employeeRepository.save(employee));
    }

    // ─── Güncelleme ───────────────────────────────────────────────────────────

    /**
     * firstName, lastName, cardNo güncellenebilir.
     * firmId, active, createdAt değişmez.
     */
    @org.springframework.transaction.annotation.Transactional
    public EmployeeResponse updateEmployee(String authHeader, Long id, EmployeeRequest request) {
        String firmId = extractFirmId(authHeader);
        Employee employee = findOwnedEmployee(firmId, id);

        // Kart numarası değişiyorsa çakışma kontrolü
        String newCardNo = request.getCardNo().trim();
        if (!employee.getCardNo().equals(newCardNo)) {
            employeeRepository.findByFirmIdAndCardNoAndActiveTrue(firmId, newCardNo)
                    .ifPresent(e -> { throw new DuplicateCardNoException(newCardNo); });
        }
        
        com.pdks.backend.entity.WorkGroup workGroup = null;
        if (request.getWorkGroupId() != null) {
            workGroup = workGroupRepository.findByFirmIdAndIdAndActiveTrue(firmId, request.getWorkGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz veya pasif çalışma grubu ID: " + request.getWorkGroupId()));
        }

        com.pdks.backend.entity.Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findByIdAndFirmIdAndActiveTrue(request.getDepartmentId(), firmId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz veya pasif departman ID: " + request.getDepartmentId()));
        }

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setCardNo(newCardNo);
        employee.setWorkGroup(workGroup);
        employee.setDepartment(department);

        if (request.getActive() != null) {
            employee.setActive(request.getActive());
            userRepository.findByEmployeeId(employee.getId()).ifPresent(user -> {
                user.setActive(request.getActive());
                userRepository.save(user);
            });
        }

        return toResponse(employeeRepository.save(employee));
    }

    // ─── Silme (soft delete) ──────────────────────────────────────────────────

    @org.springframework.transaction.annotation.Transactional
    public void deactivateEmployee(String authHeader, Long id) {
        String firmId = extractFirmId(authHeader);
        Employee employee = findOwnedEmployee(firmId, id);
        employee.setActive(false);
        employeeRepository.save(employee);
        
        userRepository.findByEmployeeId(employee.getId()).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
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

    private EmployeeResponse toResponse(Employee emp) {
        User user = userRepository.findByEmployeeId(emp.getId()).orElse(null);
        return toResponse(emp, user);
    }

    private EmployeeResponse toResponse(Employee emp, User user) {
        return EmployeeResponse.builder()
                .id(emp.getId())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .cardNo(emp.getCardNo())
                .active(emp.isActive())
                .hasAccount(user != null)
                .workGroupId(emp.getWorkGroup() != null ? emp.getWorkGroup().getId() : null)
                .workGroupName(emp.getWorkGroup() != null ? emp.getWorkGroup().getName() : null)
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .createdAt(emp.getCreatedAt())
                .build();
    }
}
