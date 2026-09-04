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

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.workGroup wg LEFT JOIN FETCH wg.days wgd LEFT JOIN FETCH wgd.shift s LEFT JOIN FETCH e.department d WHERE e.firmId = :firmId AND e.active = true")
    List<Employee> findByFirmIdAndActiveTrueWithWorkGroup(@org.springframework.data.repository.query.Param("firmId") String firmId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.workGroup wg LEFT JOIN FETCH wg.days wgd LEFT JOIN FETCH wgd.shift s LEFT JOIN FETCH e.department d WHERE e.firmId = :firmId AND e.active = true AND e.department.id = :departmentId")
    List<Employee> findByFirmIdAndActiveTrueWithWorkGroupAndDepartmentId(@org.springframework.data.repository.query.Param("firmId") String firmId, @org.springframework.data.repository.query.Param("departmentId") Long departmentId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM Employee e LEFT JOIN FETCH e.workGroup wg LEFT JOIN FETCH wg.days wgd LEFT JOIN FETCH wgd.shift s LEFT JOIN FETCH e.department d WHERE e.id = :id AND e.firmId = :firmId")
    Optional<Employee> findByIdAndFirmIdWithWorkGroup(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("firmId") String firmId);

    /** Firma + kart no ile aktif personel arar — çakışma kontrolü için */
    Optional<Employee> findByFirmIdAndCardNoAndActiveTrue(String firmId, String cardNo);

    long countByWorkGroupIdAndActiveTrue(Long workGroupId);

    List<Employee> findByDepartmentIdAndActiveTrueAndFirmId(Long departmentId, String firmId);

    long countByDepartmentIdAndActiveTrue(Long departmentId);

    int countByFirmIdAndWorkGroupIdAndActiveTrue(String firmId, Long workGroupId);
}
