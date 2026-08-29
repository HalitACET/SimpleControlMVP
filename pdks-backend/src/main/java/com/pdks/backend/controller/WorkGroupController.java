package com.pdks.backend.controller;

import com.pdks.backend.dto.WorkGroupListResponse;
import com.pdks.backend.dto.WorkGroupRequest;
import com.pdks.backend.dto.WorkGroupResponse;
import com.pdks.backend.service.WorkGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/work-groups")
@RequiredArgsConstructor
public class WorkGroupController {

    private final WorkGroupService workGroupService;

    @GetMapping
    public ResponseEntity<List<WorkGroupListResponse>> list(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(workGroupService.listActiveWorkGroups(authHeader));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkGroupResponse> getOne(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(workGroupService.getWorkGroup(authHeader, id));
    }

    @PostMapping
    public ResponseEntity<WorkGroupResponse> create(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody WorkGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workGroupService.createWorkGroup(authHeader, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkGroupResponse> update(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody WorkGroupRequest request) {
        return ResponseEntity.ok(workGroupService.updateWorkGroup(authHeader, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        workGroupService.deleteWorkGroup(authHeader, id);
        return ResponseEntity.noContent().build();
    }
}
