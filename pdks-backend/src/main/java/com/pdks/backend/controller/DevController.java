package com.pdks.backend.controller;

import com.pdks.backend.security.JwtService;
import com.pdks.backend.service.DevService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/dev")
@Profile("dev")
@RequiredArgsConstructor
public class DevController {

    private final JwtService jwtService;
    private final DevService devService;

    @PostMapping("/seed-demo")
    public ResponseEntity<Map<String, Object>> seedDemo(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        String firmId = jwtService.extractFirmId(authHeader.substring(7));
        Map<String, Object> result = devService.seedDemo(firmId);
        return ResponseEntity.ok(result);
    }
}
