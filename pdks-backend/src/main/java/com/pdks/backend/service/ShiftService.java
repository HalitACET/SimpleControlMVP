package com.pdks.backend.service;

import com.pdks.backend.dto.ShiftRequest;
import com.pdks.backend.dto.ShiftResponse;
import com.pdks.backend.entity.Shift;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DuplicateShiftNameException;
import com.pdks.backend.exception.ShiftInUseException;
import com.pdks.backend.repository.ShiftRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.repository.WorkGroupDayRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final WorkGroupDayRepository workGroupDayRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private User getAdminFromToken(String authHeader) {
        if (authHeader == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token bulunamadı.");
        }
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        Long userId = jwtService.extractUserId(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı."));
    }

    private void validateShiftRequest(ShiftRequest request) {
        if (request.getStartTime().equals(request.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Başlangıç ve bitiş saati aynı olamaz.");
        }
        
        long shiftDuration = calculateDurationRaw(request);
        if (request.getBreakMinutes() >= shiftDuration) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mola süresi vardiya süresinden uzun veya eşit olamaz.");
        }
    }

    private long calculateDurationRaw(ShiftRequest request) {
        long duration = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        if (duration <= 0) {
            duration += 24 * 60;
        }
        return duration;
    }

    private ShiftResponse mapToResponse(Shift shift) {
        boolean crossesMidnight = !shift.getEndTime().isAfter(shift.getStartTime());
        
        long durationRaw = Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
        if (durationRaw <= 0) {
            durationRaw += 24 * 60;
        }
        int durationMinutes = Math.max(0, (int) durationRaw - shift.getBreakMinutes());

        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .breakMinutes(shift.getBreakMinutes())
                .lateToleranceMinutes(shift.getLateToleranceMinutes())
                .earlyExitToleranceMinutes(shift.getEarlyExitToleranceMinutes())
                .crossesMidnight(crossesMidnight)
                .durationMinutes(durationMinutes)
                .build();
    }

    public List<ShiftResponse> listActiveShifts(String authHeader) {
        User admin = getAdminFromToken(authHeader);
        return shiftRepository.findByFirmIdAndActiveTrue(admin.getFirmId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ShiftResponse getShift(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        Shift shift = shiftRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));
        return mapToResponse(shift);
    }

    public ShiftResponse createShift(String authHeader, ShiftRequest request) {
        User admin = getAdminFromToken(authHeader);
        validateShiftRequest(request);

        shiftRepository.findByFirmIdAndNameIgnoreCaseAndActiveTrue(admin.getFirmId(), request.getName().trim())
                .ifPresent(s -> {
                    throw new DuplicateShiftNameException(s.getName());
                });

        Shift shift = Shift.builder()
                .firmId(admin.getFirmId())
                .name(request.getName().trim())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakMinutes(request.getBreakMinutes())
                .lateToleranceMinutes(request.getLateToleranceMinutes())
                .earlyExitToleranceMinutes(request.getEarlyExitToleranceMinutes())
                .active(true)
                .build();

        return mapToResponse(shiftRepository.save(shift));
    }

    public ShiftResponse updateShift(String authHeader, Long id, ShiftRequest request) {
        User admin = getAdminFromToken(authHeader);
        validateShiftRequest(request);

        Shift shift = shiftRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));

        if (!shift.getName().equalsIgnoreCase(request.getName().trim())) {
            shiftRepository.findByFirmIdAndNameIgnoreCaseAndActiveTrue(admin.getFirmId(), request.getName().trim())
                    .ifPresent(s -> {
                        throw new DuplicateShiftNameException(s.getName());
                    });
        }

        shift.setName(request.getName().trim());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setBreakMinutes(request.getBreakMinutes());
        shift.setLateToleranceMinutes(request.getLateToleranceMinutes());
        shift.setEarlyExitToleranceMinutes(request.getEarlyExitToleranceMinutes());

        return mapToResponse(shiftRepository.save(shift));
    }

    public void deleteShift(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        Shift shift = shiftRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vardiya bulunamadı."));

        int usageCount = workGroupDayRepository.countByShiftId(shift.getId());
        if (usageCount > 0) {
            throw new ShiftInUseException(usageCount);
        }

        shift.setActive(false);
        shiftRepository.save(shift);
    }
}
