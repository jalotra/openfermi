package com.law.tech.backend.agentsessions.repositories;

import com.law.tech.backend.agentsessions.models.AgentArtifact;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentArtifactRepository extends JpaRepository<AgentArtifact, String> {

    List<AgentArtifact> findByProductSessionId(String productSessionId);
}
