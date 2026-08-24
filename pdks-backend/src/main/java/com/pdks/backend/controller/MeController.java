package com.pdks.backend.controller;

import com.pdks.backend.dto.TimesheetSummaryResponse;
import com.pdks.backend.service.TimesheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class MeController {

    private final TimesheetService timesheetService;

    @GetMapping("/timesheet-summary")
    public ResponseEntity<TimesheetSummaryResponse> getTimesheetSummary(
            @RequestHeader("Authorization") String authHeader
    ) {
        return ResponseEntity.ok(timesheetService.getMyTimesheetSummary(authHeader));
    }
}
