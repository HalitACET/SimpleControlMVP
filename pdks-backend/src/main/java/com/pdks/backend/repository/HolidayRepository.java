package com.pdks.backend.repository;

import com.pdks.backend.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    
    List<Holiday> findByFirmIdOrderByHolidayDateAsc(String firmId);
    
    // Custom query to filter by year, since JPA derived queries for year are tricky without writing JPQL
    @Query("SELECT h FROM Holiday h WHERE h.firmId = :firmId AND YEAR(h.holidayDate) = :year ORDER BY h.holidayDate ASC")
    List<Holiday> findByFirmIdAndYearOrderByHolidayDateAsc(@Param("firmId") String firmId, @Param("year") int year);
    
    Optional<Holiday> findByFirmIdAndId(String firmId, Long id);
    
    Optional<Holiday> findByFirmIdAndHolidayDate(String firmId, LocalDate holidayDate);
}
