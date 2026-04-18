package com.law.tech.backend.agentsessions.controllers;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.AgentSessionEvent;
import com.law.tech.backend.agentsessions.models.AgentSessionState;
import com.law.tech.backend.agentsessions.models.dtos.AgentArtifactDto;
import com.law.tech.backend.agentsessions.models.dtos.AgentMessageDto;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionCreateRequest;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionDto;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionPromptRequest;
import com.law.tech.backend.agentsessions.repositories.AgentSessionRepository;
import com.law.tech.backend.agentsessions.services.crud.AgentSessionCrudService;
import com.law.tech.backend.agentsessions.services.crud.AgentSessionReadService;
import com.law.tech.backend.agentsessions.services.orchestration.EcsOrchestrationService;
import com.law.tech.backend.agentsessions.services.orchestration.OpenCodeWorkerService;
import com.law.tech.backend.agentsessions.services.read.AgentArtifactReadService;
import com.law.tech.backend.agentsessions.services.read.AgentMessageReadService;
import com.law.tech.backend.agentsessions.services.sync.OpenCodeSyncService;
import com.law.tech.backend.base.controllers.BaseReadController;
import com.law.tech.backend.base.models.GenericResponse;
import com.law.tech.backend.base.statemachine.StatefulController;
import com.law.tech.backend.presign.dto.PresignUrlResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-sessions")
public class AgentSessionController
        extends StatefulController<
                AgentSessionDto, AgentSession, AgentSessionRepository, AgentSessionState, AgentSessionEvent> {

    private final AgentSessionCrudService crudService;
    private final AgentSessionReadService readService;
    private final EcsOrchestrationService ecs;
    private final OpenCodeWorkerService worker;
    private final OpenCodeSyncService sync;
    private final AgentMessageReadService messageReadService;
    private final AgentArtifactReadService artifactReadService;

    public AgentSessionController(
            AgentSessionCrudService crudService,
            AgentSessionReadService readService,
            EcsOrchestrationService ecs,
            OpenCodeWorkerService worker,
            OpenCodeSyncService sync,
            AgentMessageReadService messageReadService,
            AgentArtifactReadService artifactReadService) {
        super(crudService, AgentSessionEvent.class);
        this.crudService = crudService;
        this.readService = readService;
        this.ecs = ecs;
        this.worker = worker;
        this.sync = sync;
        this.messageReadService = messageReadService;
        this.artifactReadService = artifactReadService;
    }

    @GetMapping("")
    public ResponseEntity<GenericResponse<List<AgentSessionDto>>> read(
            @RequestParam(required = false) String page, @RequestParam(required = false) String size) {
        BaseReadController<AgentSessionDto, AgentSession, AgentSessionRepository> readController =
                new BaseReadController<>(readService);
        return readController.read(page, size);
    }

    @GetMapping("/sorted")
    public ResponseEntity<GenericResponse<List<AgentSessionDto>>> readWithSorting(
            @RequestParam String direction,
            @RequestParam String sortBy,
            @RequestParam String page,
            @RequestParam String size) {
        BaseReadController<AgentSessionDto, AgentSession, AgentSessionRepository> readController =
                new BaseReadController<>(readService);
        return readController.readWithSorting(Sort.Direction.valueOf(direction.toUpperCase()), sortBy, page, size);
    }

    @GetMapping("/count")
    public ResponseEntity<GenericResponse<Long>> count() {
        BaseReadController<AgentSessionDto, AgentSession, AgentSessionRepository> readController =
                new BaseReadController<>(readService);
        return readController.count();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<GenericResponse<List<AgentSessionDto>>> getByUserId(@PathVariable String userId) {
        List<AgentSessionDto> sessions = readService.findByUserId(userId);
        return ResponseEntity.ok(
                GenericResponse.<List<AgentSessionDto>>builder().data(sessions).message("Success").build());
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
        sync.sync(id);
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

    @GetMapping("/{id}/messages")
    public ResponseEntity<GenericResponse<List<AgentMessageDto>>> messages(@PathVariable UUID id) {
        sync.sync(id);
        List<AgentMessageDto> messages = messageReadService.findBySessionIdWithParts(id.toString());
        return ResponseEntity.ok(
                GenericResponse.<List<AgentMessageDto>>builder().data(messages).message("Success").build());
    }

    @GetMapping("/{id}/artifacts")
    public ResponseEntity<GenericResponse<List<AgentArtifactDto>>> artifacts(@PathVariable UUID id) {
        sync.sync(id);
        List<AgentArtifactDto> artifacts = artifactReadService.findBySessionId(id.toString());
        return ResponseEntity.ok(
                GenericResponse.<List<AgentArtifactDto>>builder().data(artifacts).message("Success").build());
    }

    @GetMapping("/{id}/artifacts/{artifactId}/download")
    public ResponseEntity<GenericResponse<PresignUrlResponse>> downloadArtifact(
            @PathVariable UUID id, @PathVariable String artifactId) {
        PresignUrlResponse url = artifactReadService.getDownloadUrl(artifactId);
        return ResponseEntity.ok(
                GenericResponse.<PresignUrlResponse>builder().data(url).message("Success").build());
    }

    @PostMapping("/{id}/prompt")
    public ResponseEntity<GenericResponse<Boolean>> prompt(
            @PathVariable UUID id, @RequestBody @Valid AgentSessionPromptRequest request) {
        AgentSessionDto session = crudService.read(id);
        if (session.getWorkerUrl() == null || session.getWorkerUrl().isBlank()) {
            throw new RuntimeException("Session worker URL is not available");
        }
        if (session.getOpencodeSessionId() == null || session.getOpencodeSessionId().isBlank()) {
            throw new RuntimeException("Session OpenCode binding is not available");
        }
        if (!AgentSessionState.RUNNING.name().equals(session.getState())) {
            throw new RuntimeException("Session is not running");
        }
        worker.prompt(session.getWorkerUrl(), session.getOpencodeSessionId(), request);
        sync.sync(id);
        return ResponseEntity.ok(GenericResponse.<Boolean>builder().data(true).message("Prompt accepted").build());
    }

    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(@PathVariable UUID id) {
        SseEmitter emitter = new SseEmitter(0L);
        Thread.startVirtualThread(() -> {
            String marker = "";
            try {
                while (true) {
                    sync.sync(id);
                    AgentSessionDto session = crudService.read(id);
                    List<AgentMessageDto> items = messageReadService.findBySessionIdWithParts(id.toString());
                    List<AgentArtifactDto> files = artifactReadService.findBySessionId(id.toString());
                    String next = session.getState() + "|" + items.size() + "|" + files.size();
                    if (!next.equals(marker)) {
                        marker = next;
                        emitter.send(SseEmitter.event()
                                .name("snapshot")
                                .data(Map.of("session", session, "messages", items, "artifacts", files)));
                    }
                    if (AgentSessionState.COMPLETED.name().equals(session.getState())
                            || AgentSessionState.FAILED.name().equals(session.getState())
                            || AgentSessionState.TERMINATED.name().equals(session.getState())) {
                        emitter.send(SseEmitter.event().name("done").data(Map.of("state", session.getState())));
                        emitter.complete();
                        return;
                    }
                    Thread.sleep(2000);
                }
            } catch (IOException e) {
                emitter.completeWithError(e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }
}
