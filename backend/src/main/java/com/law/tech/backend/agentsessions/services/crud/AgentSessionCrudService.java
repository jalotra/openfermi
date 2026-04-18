package com.law.tech.backend.agentsessions.services.crud;

import com.law.tech.backend.agentsessions.lifecycle.AgentSessionLifecycleConfig;
import com.law.tech.backend.agentsessions.lifecycle.AgentSessionTransitionHandler;
import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.AgentSessionEvent;
import com.law.tech.backend.agentsessions.models.AgentSessionState;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionDto;
import com.law.tech.backend.agentsessions.repositories.AgentSessionRepository;
import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.statemachine.StateMachineConfigRegistrar;
import com.law.tech.backend.base.statemachine.StatefulCrudService;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AgentSessionCrudService
        extends StatefulCrudService<
                AgentSessionDto, AgentSession, AgentSessionRepository, AgentSessionState, AgentSessionEvent> {

    private final AgentSessionRepository repository;

    @Value("${ecs.max-agents-per-user}")
    private int maxAgentsPerUser;

    public AgentSessionCrudService(
            AgentSessionRepository repository,
            BaseMapper<AgentSessionDto, AgentSession> mapper,
            AgentSessionLifecycleConfig lifecycleConfig,
            StateMachineConfigRegistrar registrar,
            AgentSessionTransitionHandler transitionHandler) {
        super(repository, mapper, lifecycleConfig, registrar, transitionHandler);
        this.repository = repository;
    }

    @Override
    protected void validateBeforeSave(AgentSession entity) {
        if (entity.getId() != null) return;
        long active = repository.countByUserIdAndStateIn(
                entity.getUserId(),
                List.of(AgentSessionState.STARTING.name(), AgentSessionState.RUNNING.name()));
        if (active >= maxAgentsPerUser)
            throw new IllegalStateException(
                    "Max concurrent agents reached (" + maxAgentsPerUser + ") for user " + entity.getUserId());
    }
}
