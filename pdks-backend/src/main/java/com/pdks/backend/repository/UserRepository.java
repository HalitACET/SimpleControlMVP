package com.pdks.backend.repository;

import com.pdks.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * User tablosu için JPA repository.
 * Login her zaman firmId + username ikilisiyle yapılır —
 * aynı username farklı firmalarda bulunabilir.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Firma kodu ve kullanıcı adına göre kullanıcı arar.
     * Login akışında kullanılır.
     */
    Optional<User> findByUsernameAndFirmId(String username, String firmId);

    List<User> findByFirmId(String firmId);

    @Query("SELECT u FROM User u WHERE u.firmId = :firmId AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchUsers(@Param("firmId") String firmId, @Param("search") String search);

    long countByFirmIdAndActiveTrue(String firmId);
}
