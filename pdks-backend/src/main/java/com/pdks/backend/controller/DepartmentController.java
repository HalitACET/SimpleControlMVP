package com.pdks.backend.controller;

import com.pdks.backend.dto.DepartmentEmployeeResponse;
import com.pdks.backend.dto.DepartmentRequest;
import com.pdks.backend.dto.DepartmentResponse;
import com.pdks.backend.security.JwtService;
import com.pdks.backend.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;
    private final JwtService jwtService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentResponse createDepartment(@RequestHeader("Authorization") String token,
                                               @RequestBody DepartmentRequest request) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        return departmentService.createDepartment(firmId, request);
    }

    @PutMapping("/{id}")
    public DepartmentResponse updateDepartment(@RequestHeader("Authorization") String token,
                                               @PathVariable Long id,
                                               @RequestBody DepartmentRequest request) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        return departmentService.updateDepartment(firmId, id, request);
    }

    @GetMapping
    public List<DepartmentResponse> getActiveDepartments(@RequestHeader("Authorization") String token) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        return departmentService.getActiveDepartments(firmId);
    }

    @GetMapping("/{id}")
    public DepartmentResponse getDepartment(@RequestHeader("Authorization") String token,
                                            @PathVariable Long id) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        return departmentService.getDepartment(firmId, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(@RequestHeader("Authorization") String token,
                                 @PathVariable Long id) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        departmentService.deleteDepartment(firmId, id);
    }

    @GetMapping("/{id}/employees")
    public List<DepartmentEmployeeResponse> getDepartmentEmployees(@RequestHeader("Authorization") String token,
                                                                   @PathVariable Long id) {
        String firmId = jwtService.extractFirmId(token.substring(7));
        return departmentService.getDepartmentEmployees(firmId, id);
    }
}
