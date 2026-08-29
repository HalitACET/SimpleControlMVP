package com.pdks.backend.repository;

import com.pdks.backend.entity.WorkGroupDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkGroupDayRepository extends JpaRepository<WorkGroupDay, Long> {
    int countByShiftId(Long shiftId);
}
