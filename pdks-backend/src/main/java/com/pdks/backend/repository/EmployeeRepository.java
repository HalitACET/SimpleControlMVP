package com.pdks.backend.repository;

import com.pdks.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Employee tablosu için JPA repository.
 */
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /** Firmanın aktif personellerini listeler */
    List<Employee> findByFirmIdAndActiveTrue(String firmId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.workGroup wg LEFT JOIN FETCH wg.days wgd LEFT JOIN FETCH wgd.shift s WHERE e.firmId = :firmId AND e.active = true")
    List<Employee> findByFirmIdAndActiveTrueWithWorkGroup(@org.springframework.data.repository.query.Param("firmId") String firmId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.workGroup wg LEFT JOIN FETCH wg.days wgd LEFT JOIN FETCH wgd.shift s WHERE e.id = :id AND e.firmId = :firmId")
    Optional<Employee> findByIdAndFirmIdWithWorkGroup(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("firmId") String firmId);

    /** Firma + kart no ile aktif personel arar — çakışma kontrolü için */
    Optional<Employee> findByFirmIdAndCardNoAndActiveTrue(String firmId, String cardNo);

    int countByFirmIdAndWorkGroupIdAndActiveTrue(String firmId, Long workGroupId);
}
