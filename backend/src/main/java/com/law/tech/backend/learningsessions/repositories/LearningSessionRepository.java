package com.law.tech.backend.learningsessions.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.learningsessions.models.LearningSession;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningSessionRepository extends BaseRepository<LearningSession> {
    Optional<LearningSession> findByQuestionIdAndTutorId(UUID questionId, UUID tutorId);
    List<LearningSession> findByUserId(String userId);
}
