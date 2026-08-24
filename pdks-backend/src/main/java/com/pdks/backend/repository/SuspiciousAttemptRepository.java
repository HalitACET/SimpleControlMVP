package com.pdks.backend.repository;

import com.pdks.backend.entity.SuspiciousAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface SuspiciousAttemptRepository extends JpaRepository<SuspiciousAttempt, Long> {

    @Query("SELECT COUNT(sa) FROM SuspiciousAttempt sa WHERE sa.user.firmId = :firmId AND sa.timestamp >= :date")
    long countByFirmAndTimestampAfter(
        @Param("firmId") String firmId,
        @Param("date") LocalDateTime date
    );

    @Query("SELECT sa FROM SuspiciousAttempt sa WHERE sa.user.firmId = :firmId")
    Page<SuspiciousAttempt> findByFirmIdOrderByTimestampDesc(
        @Param("firmId") String firmId,
        Pageable pageable
    );
}
