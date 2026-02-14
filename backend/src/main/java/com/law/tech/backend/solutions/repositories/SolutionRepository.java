package com.law.tech.backend.solutions.repositories;

import com.law.tech.backend.base.repositories.BaseRepository;
import com.law.tech.backend.solutions.models.Solution;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolutionRepository extends BaseRepository<Solution> {
    Optional<Solution> findByQuestionId(UUID questionId);
}
