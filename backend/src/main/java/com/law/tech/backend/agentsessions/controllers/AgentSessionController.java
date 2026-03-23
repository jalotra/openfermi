package com.law.tech.backend.agentsessions.controllers;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.AgentSessionEvent;
import com.law.tech.backend.agentsessions.models.AgentSessionState;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionCreateRequest;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionDto;
import com.law.tech.backend.agentsessions.repositories.AgentSessionRepository;
import com.law.tech.backend.agentsessions.services.crud.AgentSessionCrudService;
import com.law.tech.backend.agentsessions.services.orchestration.EcsOrchestrationService;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.base.statemachine.StatefulController;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-sessions")
public class AgentSessionController
        extends StatefulController<
                AgentSessionDto, AgentSession, AgentSessionRepository, AgentSessionState, AgentSessionEvent> {

    private final AgentSessionCrudService crudService;
    private final EcsOrchestrationService ecs;

    public AgentSessionController(AgentSessionCrudService crudService, EcsOrchestrationService ecs) {
        super(crudService, AgentSessionEvent.class);
        this.crudService = crudService;
        this.ecs = ecs;
    }

    @PostMapping("/create")
    public ResponseEntity<GenericResponse<AgentSessionDto>> create(
            @RequestBody @Valid AgentSessionCreateRequest request) {
        AgentSessionDto dto = AgentSessionDto.builder()
                .userId(request.getUserId())
                .tokenUsage(0L)
                .cost(0.0)
                .sessionTokenCap(request.getSessionTokenCap())
                .sessionCostCap(request.getSessionCostCap())
                .build();

        AgentSessionDto created = crudService.upsert(dto);
        AgentSessionDto provisioned = crudService.transition(created.getId(), AgentSessionEvent.READY);

        return ResponseEntity.ok(
                GenericResponse.<AgentSessionDto>builder().data(provisioned).message("Agent session created").build());
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<GenericResponse<AgentSessionDto>> terminate(@PathVariable UUID id) {
        AgentSessionDto result = crudService.transition(id, AgentSessionEvent.TERMINATE);
        return ResponseEntity.ok(
                GenericResponse.<AgentSessionDto>builder().data(result).message("Agent session terminated").build());
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<GenericResponse<Map<String, Object>>> status(@PathVariable UUID id) {
        AgentSessionDto session = crudService.read(id);
        Map<String, Object> status = Map.of(
                "state", session.getState(),
                "tokenUsage", session.getTokenUsage(),
                "cost", session.getCost());
        return ResponseEntity.ok(
                GenericResponse.<Map<String, Object>>builder().data(status).message("Success").build());
    }

    @GetMapping("/{id}/health")
    public ResponseEntity<GenericResponse<Boolean>> health(@PathVariable UUID id) {
        AgentSessionDto session = crudService.read(id);
        boolean healthy = session.getWorkerUrl() != null && ecs.healthCheck(session.getWorkerUrl());
        return ResponseEntity.ok(
                GenericResponse.<Boolean>builder().data(healthy).message("Success").build());
    }
}
