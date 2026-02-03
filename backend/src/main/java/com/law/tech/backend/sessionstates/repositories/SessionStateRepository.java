package com.law.tech.backend.sessionstates.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.sessionstates.models.SessionState;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionStateRepository extends BaseRepository<SessionState> {
    Optional<SessionState> findBySession_IdAndQuestion_Id(UUID sessionId, UUID questionId);
}
