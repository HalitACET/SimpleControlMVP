package com.pdks.backend.repository;

import com.pdks.backend.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByFirmIdAndCode(String firmId, String code);
    List<Location> findByFirmId(String firmId);
}
