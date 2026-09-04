package com.pdks.backend.service;

import com.pdks.backend.dto.SimulationRequest;
import com.pdks.backend.entity.*;
import com.pdks.backend.repository.EmployeeRepository;
import com.pdks.backend.repository.HolidayRepository;
import com.pdks.backend.repository.LocationRepository;
import com.pdks.backend.repository.RawScanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Bu servis sahte mesai verisi uretir, uretim ortaminda asla aktif olmamalidir.
 */
@Service
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class SimulatorService {

    private final RawScanRepository rawScanRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayRepository holidayRepository;
    private final LocationRepository locationRepository;

    @Transactional
    public int simulate(SimulationRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Personel bulunamadi"));

        Random random = request.getSeed() != null ? new Random(request.getSeed()) : new Random();
        int count = 0;

        List<Holiday> holidays = holidayRepository.findByFirmIdOrderByHolidayDateAsc(employee.getFirmId());
        Set<LocalDate> holidayDates = holidays.stream().map(Holiday::getHolidayDate).collect(Collectors.toSet());

        List<Location> locations = locationRepository.findByFirmId(employee.getFirmId());
        Location defaultLocation = locations.isEmpty() ? null : locations.get(0);

        WorkGroup workGroup = employee.getWorkGroup();
        if (workGroup == null) {
            throw new IllegalArgumentException("Personelin calisma grubu yok, simulasyon yapilamaz");
        }

        LocalDate currentDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        while (!currentDate.isAfter(endDate)) {
            final LocalDate loopDate = currentDate;
            boolean isHoliday = holidayDates.contains(loopDate);
            
            WorkGroupDay wgDay = workGroup.getDays().stream()
                    .filter(d -> d.getDayOfWeek() == loopDate.getDayOfWeek())
                    .findFirst().orElse(null);
            
            Shift shift = wgDay != null ? wgDay.getShift() : null;

            if (isHoliday || shift == null) {
                // Tatil
                currentDate = currentDate.plusDays(1);
                continue;
            }

            int scenario = random.nextInt(100);
            if (scenario < 5) {
                // Devamsiz
                currentDate = currentDate.plusDays(1);
                continue;
            }

            boolean isNightShift = shift.getStartTime().isAfter(shift.getEndTime());
            
            LocalDateTime entryTime;
            LocalDateTime exitTime = null;

            // Giris zamani uret (Normal ~65%, Gec ~15%, Erken Cikis ~10%, Eksik Cikis ~5%)
            if (scenario >= 5 && scenario < 20) {
                // Gec giris (5-45 dk)
                int delay = 5 + random.nextInt(41);
                entryTime = loopDate.atTime(shift.getStartTime()).plusMinutes(delay);
            } else {
                // Normal giris (vardiyadan -15 ila +5 dk)
                int offset = random.nextInt(21) - 15;
                entryTime = loopDate.atTime(shift.getStartTime()).plusMinutes(offset);
            }

            count += createScan(employee, entryTime, defaultLocation, random);

            if (scenario >= 20 && scenario < 25) {
                // Eksik cikis (Cikis okutmasi yok)
            } else {
                LocalDate exitDate = isNightShift ? loopDate.plusDays(1) : loopDate;
                
                if (scenario >= 25 && scenario < 35) {
                    // Erken cikis (10-60 dk)
                    int early = 10 + random.nextInt(51);
                    exitTime = exitDate.atTime(shift.getEndTime()).minusMinutes(early);
                } else {
                    // Normal cikis (-5 ila +15 dk)
                    int offset = random.nextInt(21) - 5;
                    exitTime = exitDate.atTime(shift.getEndTime()).plusMinutes(offset);
                }
                
                // Ara okutma %10 ihtimalle
                if (random.nextInt(100) < 10) {
                    LocalDateTime midTime = entryTime.plusMinutes(random.nextInt(120) + 60);
                    if (midTime.isBefore(exitTime)) {
                        count += createScan(employee, midTime, defaultLocation, random);
                    }
                }

                count += createScan(employee, exitTime, defaultLocation, random);
            }

            currentDate = currentDate.plusDays(1);
        }
        
        return count;
    }

    private int createScan(Employee employee, LocalDateTime scannedAt, Location location, Random random) {
        boolean suspicious = random.nextInt(100) < 3;
        SuspiciousReason reason = null;
        if (suspicious) {
            SuspiciousReason[] reasons = {SuspiciousReason.MOCK_FLAG, SuspiciousReason.GEOFENCE_VIOLATION, SuspiciousReason.IMPOSSIBLE_SPEED, SuspiciousReason.FROZEN_COORDINATE};
            reason = reasons[random.nextInt(reasons.length)];
        }

        double lat = location != null ? location.getLatitude() + (random.nextDouble() * 0.001) : 41.0;
        double lng = location != null ? location.getLongitude() + (random.nextDouble() * 0.001) : 29.0;
        
        TransactionMethod method = random.nextBoolean() ? TransactionMethod.GPS : TransactionMethod.QR;

        RawScan scan = RawScan.builder()
                .employee(employee)
                .deviceId("SIM-DEVICE")
                .scannedAt(scannedAt)
                .latitude(lat)
                .longitude(lng)
                .mockLocation(suspicious && reason == SuspiciousReason.MOCK_FLAG)
                .location(location)
                .method(method)
                .qrContent(method == TransactionMethod.QR ? "SIM_QR" : null)
                .suspicious(suspicious)
                .suspiciousReason(reason)
                .build();

        rawScanRepository.save(scan);
        return 1;
    }

    @Transactional
    public int deleteSimulations(Long employeeId, LocalDate startDate, LocalDate endDate) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Personel bulunamadi"));

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<RawScan> scans = rawScanRepository.findAdminScans(employee.getFirmId(), start, end, employeeId, null, null, null);
        
        int deleted = 0;
        for (RawScan scan : scans) {
            if ("SIM-DEVICE".equals(scan.getDeviceId())) {
                rawScanRepository.delete(scan);
                deleted++;
            }
        }
        return deleted;
    }
}
