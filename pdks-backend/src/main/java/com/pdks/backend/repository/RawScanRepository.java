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

    @org.springframework.data.jpa.repository.Query("SELECT r FROM RawScan r WHERE r.employee.firmId = :firmId " +
           "AND r.scannedAt >= :start AND r.scannedAt < :end " +
           "AND (:employeeId IS NULL OR r.employee.id = :employeeId) " +
           "AND (:suspiciousOnly IS NULL OR :suspiciousOnly = false OR r.suspicious = true) " +
           "ORDER BY r.scannedAt DESC")
    java.util.List<RawScan> findAdminScans(
            @org.springframework.data.repository.query.Param("firmId") String firmId,
            @org.springframework.data.repository.query.Param("start") LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") LocalDateTime end,
            @org.springframework.data.repository.query.Param("employeeId") Long employeeId,
            @org.springframework.data.repository.query.Param("suspiciousOnly") Boolean suspiciousOnly);
}
