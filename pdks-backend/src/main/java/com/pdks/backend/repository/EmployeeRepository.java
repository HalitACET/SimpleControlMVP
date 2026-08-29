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

    /** Firma + kart no ile aktif personel arar — çakışma kontrolü için */
    Optional<Employee> findByFirmIdAndCardNoAndActiveTrue(String firmId, String cardNo);

    int countByFirmIdAndWorkGroupIdAndActiveTrue(String firmId, Long workGroupId);
}
