package com.law.tech.backend.agentsessions.services.crud;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.agentsessions.models.dtos.AgentSessionDto;
import com.law.tech.backend.agentsessions.repositories.AgentSessionRepository;
import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AgentSessionReadService
        extends BaseReadService<AgentSessionDto, AgentSession, AgentSessionRepository> {

    private final AgentSessionRepository agentSessionRepository;
    private final BaseMapper<AgentSessionDto, AgentSession> mapper;

    public AgentSessionReadService(
            AgentSessionRepository repository, BaseMapper<AgentSessionDto, AgentSession> mapper) {
        super(repository, mapper);
        this.agentSessionRepository = repository;
        this.mapper = mapper;
    }

    public List<AgentSessionDto> findByUserId(String userId) {
        return agentSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
