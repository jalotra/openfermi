package com.law.tech.backend.waitlist.controllers;

import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.waitlist.models.WaitlistStatus;
import com.law.tech.backend.waitlist.models.dtos.WaitlistRequestDto;
import com.law.tech.backend.waitlist.services.WaitlistRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/waitlist")
public class WaitlistRequestController {

    private final WaitlistRequestService waitlistService;

    public WaitlistRequestController(WaitlistRequestService waitlistService) {
        this.waitlistService = waitlistService;
    }

    @PostMapping("")
    public ResponseEntity<GenericResponse<WaitlistRequestDto>> submit(@RequestBody WaitlistSubmitRequest request) {
        WaitlistRequestDto dto = waitlistService.submitRequest(
                request.getEmail(), request.getName(), request.getMessage());
        return ResponseEntity.ok(
                GenericResponse.<WaitlistRequestDto>builder().data(dto).message("Success").build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<GenericResponse<WaitlistRequestDto>> getByEmail(@PathVariable String email) {
        Optional<WaitlistRequestDto> dto = waitlistService.findByEmail(email);
        return dto.map(d -> ResponseEntity.ok(
                GenericResponse.<WaitlistRequestDto>builder().data(d).message("Success").build()
        )).orElseGet(() -> ResponseEntity.status(404).body(
                GenericResponse.<WaitlistRequestDto>builder().data(null).message("Not found").build()
        ));
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<WaitlistRequestDto>>> list(
            @RequestParam(required = false) String status) {
        List<WaitlistRequestDto> results;
        if (status != null && !status.isBlank()) {
            results = waitlistService.findByStatus(WaitlistStatus.valueOf(status.toUpperCase()));
        } else {
            results = waitlistService.findByStatus(WaitlistStatus.PENDING);
        }
        return ResponseEntity.ok(
                GenericResponse.<List<WaitlistRequestDto>>builder().data(results).message("Success").build());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<GenericResponse<WaitlistRequestDto>> approve(@PathVariable UUID id) {
        WaitlistRequestDto dto = waitlistService.approveRequest(id);
        return ResponseEntity.ok(
                GenericResponse.<WaitlistRequestDto>builder().data(dto).message("Approved").build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<GenericResponse<WaitlistRequestDto>> reject(@PathVariable UUID id) {
        WaitlistRequestDto dto = waitlistService.rejectRequest(id);
        return ResponseEntity.ok(
                GenericResponse.<WaitlistRequestDto>builder().data(dto).message("Rejected").build());
    }

    public static class WaitlistSubmitRequest {
        private String email;
        private String name;
        private String message;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
