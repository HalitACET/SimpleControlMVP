package com.pdks.backend.controller;

import com.pdks.backend.dto.SimulationRequest;
import com.pdks.backend.service.SimulatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Bu endpoint sahte mesai verisi uretir, uretim ortaminda asla aktif olmamalidir.
 */
@RestController
@RequestMapping("/dev/simulate-scans")
@Profile("dev")
@RequiredArgsConstructor
public class SimulatorController {

    private final SimulatorService simulatorService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> simulateScans(@RequestBody SimulationRequest request) {
        int count = simulatorService.simulate(request);
        return ResponseEntity.ok(Map.of("message", "Simulasyon tamamlandi", "count", count));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteSimulatedScans(
            @RequestParam Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        int deletedCount = simulatorService.deleteSimulations(employeeId, startDate, endDate);
        return ResponseEntity.ok(Map.of("message", "Simulasyon kayitlari silindi", "deletedCount", deletedCount));
    }
}
