package com.pdks.backend.service;

import com.pdks.backend.dto.WorkGroupDayRequest;
import com.pdks.backend.dto.WorkGroupDayResponse;
import com.pdks.backend.dto.WorkGroupListResponse;
import com.pdks.backend.dto.WorkGroupRequest;
import com.pdks.backend.dto.WorkGroupResponse;
import com.pdks.backend.entity.Shift;
import com.pdks.backend.entity.User;
import com.pdks.backend.entity.WorkGroup;
import com.pdks.backend.entity.WorkGroupDay;
import com.pdks.backend.exception.DuplicateWorkGroupNameException;
import com.pdks.backend.exception.WorkGroupInUseException;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.ShiftRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.repository.WorkGroupRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkGroupService {

    private final WorkGroupRepository workGroupRepository;
    private final ShiftRepository shiftRepository;
    private final EmployeeRepository employeeRepository;
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

    private void validateWorkGroupRequest(String firmId, WorkGroupRequest request) {
        if (request.getDays() == null || request.getDays().size() != 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tam olarak 7 günlük veri gönderilmelidir.");
        }

        Set<Integer> daysSet = new HashSet<>();
        for (WorkGroupDayRequest day : request.getDays()) {
            if (day.getDayOfWeek() < 1 || day.getDayOfWeek() > 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gün değeri 1 ile 7 arasında olmalıdır.");
            }
            if (!daysSet.add(day.getDayOfWeek())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Her gün sadece bir kez tanımlanabilir.");
            }
            
            if (day.getShiftId() != null) {
                Shift shift = shiftRepository.findByFirmIdAndIdAndActiveTrue(firmId, day.getShiftId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz vardiya ID: " + day.getShiftId()));
            }
        }
    }

    public List<WorkGroupListResponse> listActiveWorkGroups(String authHeader) {
        User admin = getAdminFromToken(authHeader);
        return workGroupRepository.findByFirmIdAndActiveTrue(admin.getFirmId()).stream()
                .map(wg -> {
                    int empCount = employeeRepository.countByFirmIdAndWorkGroupIdAndActiveTrue(admin.getFirmId(), wg.getId());
                    int activeDays = (int) wg.getDays().stream().filter(d -> d.getShift() != null).count();
                    return WorkGroupListResponse.builder()
                            .id(wg.getId())
                            .name(wg.getName())
                            .dailyWorkMinutes(wg.getDailyWorkMinutes())
                            .employeeCount(empCount)
                            .activeDaysCount(activeDays)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public WorkGroupResponse getWorkGroup(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        WorkGroup wg = workGroupRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Çalışma grubu bulunamadı."));
        
        int empCount = employeeRepository.countByFirmIdAndWorkGroupIdAndActiveTrue(admin.getFirmId(), id);
        return mapToResponse(wg, empCount);
    }

    @Transactional
    public WorkGroupResponse createWorkGroup(String authHeader, WorkGroupRequest request) {
        User admin = getAdminFromToken(authHeader);
        validateWorkGroupRequest(admin.getFirmId(), request);

        workGroupRepository.findByFirmIdAndNameIgnoreCaseAndActiveTrue(admin.getFirmId(), request.getName().trim())
                .ifPresent(wg -> {
                    throw new DuplicateWorkGroupNameException(wg.getName());
                });

        WorkGroup wg = WorkGroup.builder()
                .firmId(admin.getFirmId())
                .name(request.getName().trim())
                .dailyWorkMinutes(request.getDailyWorkMinutes())
                .active(true)
                .days(new ArrayList<>())
                .build();

        for (WorkGroupDayRequest dayReq : request.getDays()) {
            Shift shift = dayReq.getShiftId() != null ? shiftRepository.findById(dayReq.getShiftId()).orElse(null) : null;
            wg.getDays().add(WorkGroupDay.builder()
                    .workGroup(wg)
                    .dayOfWeek(DayOfWeek.of(dayReq.getDayOfWeek()))
                    .shift(shift)
                    .build());
        }

        WorkGroup saved = workGroupRepository.save(wg);
        return mapToResponse(saved, 0);
    }

    @Transactional
    public WorkGroupResponse updateWorkGroup(String authHeader, Long id, WorkGroupRequest request) {
        User admin = getAdminFromToken(authHeader);
        validateWorkGroupRequest(admin.getFirmId(), request);

        WorkGroup wg = workGroupRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Çalışma grubu bulunamadı."));

        if (!wg.getName().equalsIgnoreCase(request.getName().trim())) {
            workGroupRepository.findByFirmIdAndNameIgnoreCaseAndActiveTrue(admin.getFirmId(), request.getName().trim())
                    .ifPresent(existing -> {
                        throw new DuplicateWorkGroupNameException(existing.getName());
                    });
        }

        wg.setName(request.getName().trim());
        wg.setDailyWorkMinutes(request.getDailyWorkMinutes());

        for (WorkGroupDayRequest dayReq : request.getDays()) {
            WorkGroupDay existingDay = wg.getDays().stream()
                    .filter(d -> d.getDayOfWeek().getValue() == dayReq.getDayOfWeek())
                    .findFirst()
                    .orElse(null);

            Shift shift = dayReq.getShiftId() != null ? shiftRepository.findById(dayReq.getShiftId()).orElse(null) : null;
            if (existingDay != null) {
                existingDay.setShift(shift);
            }
        }

        WorkGroup saved = workGroupRepository.save(wg);
        int empCount = employeeRepository.countByFirmIdAndWorkGroupIdAndActiveTrue(admin.getFirmId(), id);
        return mapToResponse(saved, empCount);
    }

    public void deleteWorkGroup(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        WorkGroup wg = workGroupRepository.findByFirmIdAndIdAndActiveTrue(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Çalışma grubu bulunamadı."));

        int empCount = employeeRepository.countByFirmIdAndWorkGroupIdAndActiveTrue(admin.getFirmId(), id);
        if (empCount > 0) {
            throw new WorkGroupInUseException(empCount);
        }

        wg.setActive(false);
        workGroupRepository.save(wg);
    }

    private WorkGroupResponse mapToResponse(WorkGroup wg, int employeeCount) {
        List<WorkGroupDayResponse> days = wg.getDays().stream()
                .map(d -> {
                    Shift s = d.getShift();
                    return WorkGroupDayResponse.builder()
                            .dayOfWeek(d.getDayOfWeek().getValue())
                            .shiftId(s != null ? s.getId() : null)
                            .shiftName(s != null ? s.getName() : null)
                            .shiftStartTime(s != null ? s.getStartTime() : null)
                            .shiftEndTime(s != null ? s.getEndTime() : null)
                            .build();
                })
                .collect(Collectors.toList());

        return WorkGroupResponse.builder()
                .id(wg.getId())
                .name(wg.getName())
                .dailyWorkMinutes(wg.getDailyWorkMinutes())
                .active(wg.isActive())
                .employeeCount(employeeCount)
                .days(days)
                .build();
    }
}
