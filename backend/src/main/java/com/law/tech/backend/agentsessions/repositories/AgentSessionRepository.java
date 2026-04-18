package com.law.tech.backend.agentsessions.repositories;

import com.law.tech.backend.agentsessions.models.AgentSession;
import com.law.tech.backend.base.statemachine.StatefulRepository;

import java.util.List;

public interface AgentSessionRepository extends StatefulRepository<AgentSession> {

    long countByUserIdAndStateIn(String userId, List<String> states);

    List<AgentSession> findByUserId(String userId);

    List<AgentSession> findByUserIdOrderByCreatedAtDesc(String userId);
}
