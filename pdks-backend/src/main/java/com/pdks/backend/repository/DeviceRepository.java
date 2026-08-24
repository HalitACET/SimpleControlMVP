package com.pdks.backend.repository;

import com.pdks.backend.entity.Device;
import com.pdks.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Device tablosu için Spring Data JPA repository.
 */
public interface DeviceRepository extends JpaRepository<Device, Long> {

    /** Kullanıcıya ait cihazı getir */
    Optional<Device> findByUser(User user);

    /** deviceId ile cihazı getir */
    Optional<Device> findByDeviceId(String deviceId);

    /** Kullanıcının kayıtlı cihazı var mı? */
    boolean existsByUser(User user);

    @Query("SELECT d FROM Device d WHERE d.user.firmId = :firmId")
    List<Device> findByFirmId(@Param("firmId") String firmId);
}
