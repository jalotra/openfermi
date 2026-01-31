package com.law.tech.backend.controllers;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.law.tech.backend.base.models.GenericResponse;

@RestController(value = "HealthController")
@RequestMapping(
        value = "/health",
        consumes = MediaType.ALL_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
)
public class HealthController {
    @GetMapping
    public ResponseEntity<GenericResponse<String>> health() {
        return ResponseEntity.ok(
                GenericResponse.<String>builder()
                        .data("OK")
                        .message("Success")
                        .build()
        );
    }
}
