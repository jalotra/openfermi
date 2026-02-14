package com.law.tech.backend.solutions.services.crud;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.base.services.BaseCrudService;
import com.law.tech.backend.solutions.models.Solution;
import com.law.tech.backend.solutions.models.dtos.SolutionDto;
import com.law.tech.backend.solutions.repositories.SolutionRepository;
import org.springframework.stereotype.Service;

@Service
public class SolutionCrudService extends BaseCrudService<SolutionDto, Solution, SolutionRepository> {
    public SolutionCrudService(SolutionRepository repository, BaseMapper<SolutionDto, Solution> mapper) {
        super(repository, mapper);
    }
}
