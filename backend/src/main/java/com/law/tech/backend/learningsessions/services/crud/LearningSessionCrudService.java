package com.law.tech.backend.learningsessions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.learningsessions.models.LearningSession;
import com.law.tech.backend.learningsessions.models.dtos.LearningSessionDto;
import com.law.tech.backend.learningsessions.repositories.LearningSessionRepository;
import org.springframework.stereotype.Service;

@Service
public class LearningSessionCrudService extends BaseCrudService<LearningSessionDto, LearningSession, LearningSessionRepository> {
    public LearningSessionCrudService(LearningSessionRepository repository, BaseMapper<LearningSessionDto, LearningSession> mapper) {
        super(repository, mapper);
    }
}
