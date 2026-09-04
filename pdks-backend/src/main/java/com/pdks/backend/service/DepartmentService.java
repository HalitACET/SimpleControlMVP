package com.pdks.backend.service;

import com.pdks.backend.dto.DepartmentEmployeeResponse;
import com.pdks.backend.dto.DepartmentRequest;
import com.pdks.backend.dto.DepartmentResponse;
import com.pdks.backend.entity.Department;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DepartmentHasEmployeesException;
import com.pdks.backend.exception.DuplicateDepartmentNameException;
import com.pdks.backend.repository.DepartmentRepository;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional
    public DepartmentResponse createDepartment(String firmId, DepartmentRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departman adı zorunludur");
        }

        if (departmentRepository.findByFirmIdAndNameAndActiveTrue(firmId, request.getName().trim()).isPresent()) {
            throw new DuplicateDepartmentNameException(request.getName().trim());
        }

        try {
            Department department = Department.builder()
                    .firmId(firmId)
                    .name(request.getName().trim())
                    .description(request.getDescription())
                    .active(true)
                    .build();

            department = departmentRepository.save(department);
            return toResponse(department);
        } catch (DataIntegrityViolationException e) {
            String msg = e.getMessage().toLowerCase();
            if (msg.contains("uq_departments_firm_name_active") || msg.contains("unique")) {
                throw new DuplicateDepartmentNameException(request.getName().trim());
            }
            throw e;
        }
    }

    @Transactional
    public DepartmentResponse updateDepartment(String firmId, Long id, DepartmentRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departman adı zorunludur");
        }

        Department department = departmentRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departman bulunamadı"));

        String newName = request.getName().trim();

        if (!department.getName().equals(newName)) {
            if (departmentRepository.findByFirmIdAndNameAndActiveTrue(firmId, newName).isPresent()) {
                throw new DuplicateDepartmentNameException(newName);
            }
        }

        department.setName(newName);
        department.setDescription(request.getDescription());

        try {
            department = departmentRepository.save(department);
            return toResponse(department);
        } catch (DataIntegrityViolationException e) {
            String msg = e.getMessage().toLowerCase();
            if (msg.contains("uq_departments_firm_name_active") || msg.contains("unique")) {
                throw new DuplicateDepartmentNameException(newName);
            }
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getActiveDepartments(String firmId) {
        return departmentRepository.findByFirmIdAndActiveTrueOrderByNameAsc(firmId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartment(String firmId, Long id) {
        Department department = departmentRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departman bulunamadı"));
        return toResponse(department);
    }

    @Transactional
    public void deleteDepartment(String firmId, Long id) {
        Department department = departmentRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departman bulunamadı"));

        long activeEmployeeCount = employeeRepository.countByDepartmentIdAndActiveTrue(id);
        if (activeEmployeeCount > 0) {
            throw new DepartmentHasEmployeesException(activeEmployeeCount);
        }

        department.setActive(false);
        departmentRepository.save(department);
    }

    @Transactional(readOnly = true)
    public List<DepartmentEmployeeResponse> getDepartmentEmployees(String firmId, Long id) {
        Department department = departmentRepository.findByIdAndFirmIdAndActiveTrue(id, firmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departman bulunamadı"));

        List<Employee> employees = employeeRepository.findByDepartmentIdAndActiveTrueAndFirmId(id, firmId);

        return employees.stream().map(emp -> {
            boolean hasAccount = userRepository.findByEmployeeId(emp.getId()).map(User::isActive).orElse(false);
            return DepartmentEmployeeResponse.builder()
                    .id(emp.getId())
                    .firstName(emp.getFirstName())
                    .lastName(emp.getLastName())
                    .cardNo(emp.getCardNo())
                    .workGroupName(emp.getWorkGroup() != null ? emp.getWorkGroup().getName() : null)
                    .hasAccount(hasAccount)
                    .build();
        }).collect(Collectors.toList());
    }

    private DepartmentResponse toResponse(Department department) {
        long employeeCount = employeeRepository.countByDepartmentIdAndActiveTrue(department.getId());
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .active(department.isActive())
                .employeeCount(employeeCount)
                .build();
    }
}
