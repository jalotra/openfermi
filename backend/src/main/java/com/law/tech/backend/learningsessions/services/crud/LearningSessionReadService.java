package com.law.tech.backend.learningsessions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import com.law.tech.backend.learningsessions.models.LearningSession;
import com.law.tech.backend.learningsessions.models.dtos.LearningSessionDto;
import com.law.tech.backend.learningsessions.repositories.LearningSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LearningSessionReadService extends BaseReadService<LearningSessionDto, LearningSession, LearningSessionRepository> {

    private final LearningSessionRepository learningSessionRepository;
    private final BaseMapper<LearningSessionDto, LearningSession> mapper;

    public LearningSessionReadService(LearningSessionRepository repository, BaseMapper<LearningSessionDto, LearningSession> mapper) {
        super(repository, mapper);
        this.learningSessionRepository = repository;
        this.mapper = mapper;
    }

    public Optional<LearningSessionDto> findByQuestionIdAndTutorId(UUID questionId, UUID tutorId) {
        return learningSessionRepository.findByQuestionIdAndTutorId(questionId, tutorId).map(mapper::toDto);
    }

    public List<LearningSessionDto> findByQuestionId(UUID questionId) {
        return learningSessionRepository.findByQuestionId(questionId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public List<LearningSessionDto> findByUserId(String userId) {
        return learningSessionRepository.findByUserId(userId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
