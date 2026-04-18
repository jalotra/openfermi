package com.law.tech.backend.agentsessions.repositories;

import com.law.tech.backend.agentsessions.models.AgentPart;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentPartRepository extends JpaRepository<AgentPart, String> {

    List<AgentPart> findByProductSessionId(String productSessionId);

    List<AgentPart> findByMessageIdOrderBySyncedAtAsc(String messageId);
}
