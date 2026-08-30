package com.pdks.backend.repository;

import com.pdks.backend.entity.RawScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pdks.backend.entity.Employee;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RawScanRepository extends JpaRepository<RawScan, Long> {
    Optional<RawScan> findByClientId(String clientId);
    Optional<RawScan> findTopByEmployeeOrderByScannedAtDesc(Employee employee);
    long countByEmployeeAndScannedAtBetween(Employee employee, LocalDateTime start, LocalDateTime end);
}
