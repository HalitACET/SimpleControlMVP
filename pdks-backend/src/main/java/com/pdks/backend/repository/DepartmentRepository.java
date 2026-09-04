package com.pdks.backend.repository;

import com.pdks.backend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    Optional<Department> findByIdAndFirmIdAndActiveTrue(Long id, String firmId);
    
    Optional<Department> findByFirmIdAndNameAndActiveTrue(String firmId, String name);
    
    List<Department> findByFirmIdAndActiveTrueOrderByNameAsc(String firmId);
}
