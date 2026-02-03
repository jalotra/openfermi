package com.law.tech.backend.sessionstates.controllers;

import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.sessionstates.models.dtos.SessionStateDto;
import com.law.tech.backend.sessionstates.services.SessionStateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/session-states")
public class SessionStateController {
    private final SessionStateService sessionStateService;

    public SessionStateController(SessionStateService sessionStateService) {
        this.sessionStateService = sessionStateService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<SessionStateDto>> getState(
            @RequestParam UUID sessionId,
            @RequestParam UUID questionId
    ) {
        Optional<SessionStateDto> state = sessionStateService.getState(sessionId, questionId);
        if (state.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    GenericResponse.<SessionStateDto>builder()
                            .data(null)
                            .message("Session state not found")
                            .build()
            );
        }
        return ResponseEntity.ok(
                GenericResponse.<SessionStateDto>builder()
                        .data(state.get())
                        .message("Success")
                        .build()
        );
    }

    @PutMapping("")
    public ResponseEntity<GenericResponse<SessionStateDto>> upsertState(
            @RequestBody @Valid SessionStateDto dto
    ) {
        if (dto.getSessionId() == null || dto.getQuestionId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    GenericResponse.<SessionStateDto>builder()
                            .data(null)
                            .message("sessionId and questionId are required")
                            .build()
            );
        }

        SessionStateDto saved = sessionStateService.upsertState(
                dto.getSessionId(),
                dto.getQuestionId(),
                dto.getTldrawSnapshot()
        );

        return ResponseEntity.ok(
                GenericResponse.<SessionStateDto>builder()
                        .data(saved)
                        .message("Success")
                        .build()
        );
    }
}
