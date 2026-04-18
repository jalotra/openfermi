package com.law.tech.backend.agentsessions.repositories;

import com.law.tech.backend.agentsessions.models.AgentMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentMessageRepository extends JpaRepository<AgentMessage, String> {

    List<AgentMessage> findByProductSessionIdOrderByCreatedAtAsc(String productSessionId);
}
