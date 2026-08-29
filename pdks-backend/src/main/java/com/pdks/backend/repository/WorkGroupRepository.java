package com.pdks.backend.repository;

import com.pdks.backend.entity.WorkGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkGroupRepository extends JpaRepository<WorkGroup, Long> {
    List<WorkGroup> findByFirmIdAndActiveTrue(String firmId);
    Optional<WorkGroup> findByFirmIdAndIdAndActiveTrue(String firmId, Long id);
    Optional<WorkGroup> findByFirmIdAndNameIgnoreCaseAndActiveTrue(String firmId, String name);
}
