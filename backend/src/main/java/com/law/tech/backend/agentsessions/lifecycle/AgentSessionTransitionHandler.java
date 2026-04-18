package com.law.tech.backend.agentsessions.lifecycle;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.AgentSessionEvent;
import com.law.tech.backend.agentsessions.models.AgentSessionState;
import com.law.tech.backend.agentsessions.services.orchestration.EcsOrchestrationService;
import com.law.tech.backend.agentsessions.services.orchestration.OpenCodeWorkerService;
import com.law.tech.backend.base.statemachine.TransitionHandler;
import com.law.tech.backend.base.statemachine.TransitionHook;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AgentSessionTransitionHandler
        implements TransitionHandler<AgentSession, AgentSessionState, AgentSessionEvent> {

    private static final Logger log = LoggerFactory.getLogger(AgentSessionTransitionHandler.class);

    private final EcsOrchestrationService ecs;
    private final OpenCodeWorkerService worker;

    public AgentSessionTransitionHandler(EcsOrchestrationService ecs, OpenCodeWorkerService worker) {
        this.ecs = ecs;
        this.worker = worker;
    }

    @Override
    public List<TransitionHook<AgentSession, AgentSessionState, AgentSessionEvent>> afterTransition(
            AgentSessionEvent event) {
        return switch (event) {
            case READY -> List.of(provision());
            case TERMINATE -> List.of(stop());
            case FAIL -> List.of(cleanup());
            default -> List.of();
        };
    }

    @Override
    public List<String> afterTransitionNames(AgentSessionEvent event) {
        return switch (event) {
            case READY -> List.of("provision");
            case TERMINATE -> List.of("stop");
            case FAIL -> List.of("cleanup");
            default -> List.of();
        };
    }

    private TransitionHook<AgentSession, AgentSessionState, AgentSessionEvent> provision() {
        return ctx -> {
            AgentSession session = ctx.entity();
            String arn = ecs.provision(session);
            session.setTaskArn(arn);
            String workerUrl = ecs.awaitWorkerUrl(arn);
            session.setWorkerUrl(workerUrl);
            if (!ecs.healthCheck(workerUrl)) {
                throw new RuntimeException("Worker health check failed for session " + session.getId());
            }
            OpenCodeWorkerService.SessionInfo info = worker.createSession(workerUrl);
            session.setOpencodeSessionId(info.sessionId());
            session.setOpencodeProjectId(info.projectId());
            log.info("Provisioned ECS task {} and OpenCode session {} for agent session {}", arn, info.sessionId(), session.getId());
        };
    }

    private TransitionHook<AgentSession, AgentSessionState, AgentSessionEvent> stop() {
        return ctx -> {
            AgentSession session = ctx.entity();
            if (session.getTaskArn() != null) {
                ecs.stop(session.getTaskArn());
                log.info("Stopped ECS task {} for agent session {}", session.getTaskArn(), session.getId());
            }
        };
    }

    private TransitionHook<AgentSession, AgentSessionState, AgentSessionEvent> cleanup() {
        return ctx -> {
            AgentSession session = ctx.entity();
            if (session.getTaskArn() != null) {
                try {
                    ecs.stop(session.getTaskArn());
                    log.info("Cleaned up ECS task {} for failed session {}", session.getTaskArn(), session.getId());
                } catch (Exception e) {
                    log.warn("Failed to stop ECS task {} during cleanup: {}", session.getTaskArn(), e.getMessage());
                }
            }
        };
    }
}
