package com.pdks.backend.repository;

import com.pdks.backend.entity.TransactionRecord;
import com.pdks.backend.entity.TransactionType;
import com.pdks.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long> {
    Optional<TransactionRecord> findTopByUserOrderByTimestampDesc(User user);
    Page<TransactionRecord> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    Optional<TransactionRecord> findByUserAndDeviceIdAndTimestampBetween(User user, String deviceId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) FROM TransactionRecord t WHERE t.user.firmId = :firmId AND t.type = :type AND t.timestamp >= :start AND t.timestamp <= :end")
    long countByFirmAndTypeAndTimestampBetween(
        @Param("firmId") String firmId,
        @Param("type") TransactionType type,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("SELECT t FROM TransactionRecord t WHERE t.user.firmId = :firmId AND t.timestamp = (SELECT MAX(t2.timestamp) FROM TransactionRecord t2 WHERE t2.user = t.user)")
    List<TransactionRecord> findLatestTransactionsByFirm(@Param("firmId") String firmId);

    @Query("SELECT t FROM TransactionRecord t WHERE t.user.firmId = :firmId AND " +
           "(:username IS NULL OR LOWER(t.user.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(cast(:start as timestamp) IS NULL OR t.timestamp >= :start) AND " +
           "(cast(:end as timestamp) IS NULL OR t.timestamp <= :end)")
    Page<TransactionRecord> filterTransactions(
        @Param("firmId") String firmId,
        @Param("username") String username,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        Pageable pageable
    );

    @Query("SELECT t FROM TransactionRecord t WHERE t.user.firmId = :firmId AND " +
           "(:username IS NULL OR LOWER(t.user.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(cast(:start as timestamp) IS NULL OR t.timestamp >= :start) AND " +
           "(cast(:end as timestamp) IS NULL OR t.timestamp <= :end) " +
           "ORDER BY t.timestamp DESC")
    List<TransactionRecord> filterTransactionsAll(
        @Param("firmId") String firmId,
        @Param("username") String username,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    List<TransactionRecord> findByUserAndTimestampBetweenOrderByTimestampAsc(User user, LocalDateTime start, LocalDateTime end);
}
