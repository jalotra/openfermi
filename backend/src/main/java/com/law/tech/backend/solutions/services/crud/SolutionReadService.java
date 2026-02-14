package com.law.tech.backend.solutions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseReadService;
import com.law.tech.backend.solutions.models.Solution;
import com.law.tech.backend.solutions.models.dtos.SolutionDto;
import com.law.tech.backend.solutions.repositories.SolutionRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class SolutionReadService extends BaseReadService<SolutionDto, Solution, SolutionRepository> {

    private final SolutionRepository solutionRepository;
    private final BaseMapper<SolutionDto, Solution> mapper;

    public SolutionReadService(SolutionRepository repository, BaseMapper<SolutionDto, Solution> mapper) {
        super(repository, mapper);
        this.solutionRepository = repository;
        this.mapper = mapper;
    }

    public Optional<SolutionDto> findByQuestionId(UUID questionId) {
        return solutionRepository.findByQuestionId(questionId).map(mapper::toDto);
    }
}
