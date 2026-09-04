package com.pdks.backend.service;

import com.pdks.backend.dto.*;
import com.pdks.backend.entity.Employee;
import com.pdks.backend.entity.Role;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DuplicateEmployeeAccountException;
import com.pdks.backend.exception.DuplicateUsernameException;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Kullanıcı hesabı yönetim servisi — Faz 5.
 *
 * Kapsam: sadece EMPLOYEE rolündeki hesaplar.
 * ADMIN hesapları bu servis üzerinden oluşturulamaz, değiştirilemez.
 * Yetki yükseltme yolu kapalıdır.
 */
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Firmanın tüm EMPLOYEE rolündeki kullanıcılarını döner.
     * ADMIN hesapları listede görünmez — İK, admin hesabını pasife alamamalı.
     */
    public List<UserResponse> listUsers(String firmId) {
        return userRepository.findByFirmId(firmId).stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Yeni EMPLOYEE hesabı oluşturur.
     * - Rol her zaman EMPLOYEE olarak atanır (istekte rol alanı yok)
     * - Kullanıcı adı (username) olarak personelin kart numarası (cardNo) atanır
     * - mustChangePassword = true (ilk girişte değiştirme zorunlu)
     * - Şifre BCrypt ile hash'lenir
     */
    @Transactional
    public UserResponse createUser(String firmId, UserCreateRequest request) {
        // Zorunlu alan kontrolleri
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Şifre boş bırakılamaz");
        }
        if (request.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personel seçimi zorunludur");
        }

        // Personel mevcut, aktif ve bu firmaya ait mi?
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Personel bulunamadı (id: " + request.getEmployeeId() + ")"
                ));

        if (!employee.getFirmId().equals(firmId)) {
            // Farklı firmaya ait — varlığı belli etme, 404 döner
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Personel bulunamadı");
        }

        if (!employee.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pasif personele hesap açılamaz");
        }

        // Username olarak personelin kart numarası kullanılır
        String generatedUsername = employee.getCardNo();

        // 1. Bu personelin zaten hesabı var mı?
        Optional<User> existingByEmployee = userRepository.findByEmployeeId(employee.getId());
        if (existingByEmployee.isPresent()) {
            throw new DuplicateEmployeeAccountException();
        }

        // 2. Bu kart numarası (kimlik) başka bir hesap tarafından alınmış mı? (Örn. pasife alınmış eski personel hesabı)
        Optional<User> existingByUsername = userRepository.findByUsernameAndFirmId(generatedUsername, firmId);
        if (existingByUsername.isPresent()) {
            throw new DuplicateUsernameException(generatedUsername);
        }

        // Kaydet
        try {
            User user = User.builder()
                    .firmId(firmId)
                    .username(generatedUsername) // Kart numarası
                    .password(passwordEncoder.encode(request.getPassword()))
                    .employee(employee)
                    .role(Role.EMPLOYEE)         // Her zaman EMPLOYEE — değiştirilemez
                    .mustChangePassword(true)    // İlk girişte şifre değiştirme zorunlu
                    .active(true)
                    .build();

            User saved = userRepository.save(user);
            return toResponse(saved);

        } catch (DataIntegrityViolationException ex) {
            // uq_users_employee kısıtı ihlali — personelin zaten hesabı var
            // Ham DB hatasını sızdırmak yerine anlamlı hata döndür
            String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
            if (msg.contains("employee_id") || msg.contains("uq_users") || msg.contains("unique")) {
                throw new DuplicateEmployeeAccountException();
            }
            throw ex; // Beklenmedik hata — GlobalExceptionHandler yakalar
        }
    }

    /**
     * Kullanıcıyı aktif veya pasif yapar.
     * ADMIN rolündeki kullanıcılar 404 döner — varlıkları belli edilmez.
     */
    @Transactional
    public UserResponse updateStatus(String firmId, Long userId, UserStatusUpdateRequest request) {
        User user = findEmployeeUserOrNotFound(firmId, userId);
        user.setActive(request.isActive());
        return toResponse(userRepository.save(user));
    }

    /**
     * Kullanıcının şifresini sıfırlar.
     * mustChangePassword tekrar true yapılır — kullanıcı bir sonraki girişte şifresini değiştirmek zorunda.
     * ADMIN rolündeki kullanıcılar 404 döner.
     */
    @Transactional
    public UserResponse resetPassword(String firmId, Long userId, PasswordResetRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yeni şifre boş bırakılamaz");
        }

        User user = findEmployeeUserOrNotFound(firmId, userId);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(true);
        return toResponse(userRepository.save(user));
    }

    /**
     * Verilen ID'li kullanıcıyı bulur.
     * ADMIN rolüyse veya bu firmaya ait değilse 404 döner.
     * Güvenlik: ADMIN hesabının varlığını bile belli etme.
     */
    private User findEmployeeUserOrNotFound(String firmId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı"));

        // Farklı firmaysa veya ADMIN rolündeyse 404 — güvenlik: varlığı bile belli etme
        if (!user.getFirmId().equals(firmId) || user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı");
        }

        return user;
    }

    private UserResponse toResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .active(user.isActive())
                .mustChangePassword(user.isMustChangePassword());

        if (user.getEmployee() != null) {
            builder
                    .employeeId(user.getEmployee().getId())
                    .employeeName(user.getEmployee().getFirstName() + " " + user.getEmployee().getLastName())
                    .cardNo(user.getEmployee().getCardNo());
        }

        return builder.build();
    }
}
