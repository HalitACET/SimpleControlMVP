package com.pdks.backend.service;

import com.pdks.backend.dto.HolidayRequest;
import com.pdks.backend.dto.HolidayResponse;
import com.pdks.backend.entity.Holiday;
import com.pdks.backend.entity.User;
import com.pdks.backend.exception.DuplicateHolidayDateException;
import com.pdks.backend.repository.HolidayRepository;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
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

    public List<HolidayResponse> listHolidays(String authHeader, Integer year) {
        User admin = getAdminFromToken(authHeader);
        List<Holiday> holidays;
        
        if (year != null) {
            holidays = holidayRepository.findByFirmIdAndYearOrderByHolidayDateAsc(admin.getFirmId(), year);
        } else {
            holidays = holidayRepository.findByFirmIdOrderByHolidayDateAsc(admin.getFirmId());
        }
        
        return holidays.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public HolidayResponse getHoliday(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        Holiday holiday = holidayRepository.findByFirmIdAndId(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tatil bulunamadı."));
        return mapToResponse(holiday);
    }

    public HolidayResponse createHoliday(String authHeader, HolidayRequest request) {
        User admin = getAdminFromToken(authHeader);

        holidayRepository.findByFirmIdAndHolidayDate(admin.getFirmId(), request.getHolidayDate())
                .ifPresent(h -> {
                    throw new DuplicateHolidayDateException(h.getHolidayDate());
                });

        Holiday holiday = Holiday.builder()
                .firmId(admin.getFirmId())
                .holidayDate(request.getHolidayDate())
                .name(request.getName().trim())
                .build();

        return mapToResponse(holidayRepository.save(holiday));
    }

    public HolidayResponse updateHoliday(String authHeader, Long id, HolidayRequest request) {
        User admin = getAdminFromToken(authHeader);

        Holiday holiday = holidayRepository.findByFirmIdAndId(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tatil bulunamadı."));

        if (!holiday.getHolidayDate().equals(request.getHolidayDate())) {
            holidayRepository.findByFirmIdAndHolidayDate(admin.getFirmId(), request.getHolidayDate())
                    .ifPresent(h -> {
                        throw new DuplicateHolidayDateException(h.getHolidayDate());
                    });
        }

        holiday.setHolidayDate(request.getHolidayDate());
        holiday.setName(request.getName().trim());

        return mapToResponse(holidayRepository.save(holiday));
    }

    public void deleteHoliday(String authHeader, Long id) {
        User admin = getAdminFromToken(authHeader);
        Holiday holiday = holidayRepository.findByFirmIdAndId(admin.getFirmId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tatil bulunamadı."));
        
        holidayRepository.delete(holiday);
    }

    private HolidayResponse mapToResponse(Holiday holiday) {
        return HolidayResponse.builder()
                .id(holiday.getId())
                .holidayDate(holiday.getHolidayDate())
                .name(holiday.getName())
                .build();
    }
}
