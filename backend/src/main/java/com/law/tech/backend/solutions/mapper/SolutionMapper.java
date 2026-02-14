package com.law.tech.backend.solutions.mapper;

import com.law.tech.backend.base.mappers.BaseMapper;
import com.law.tech.backend.solutions.models.Solution;
import com.law.tech.backend.solutions.models.dtos.SolutionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface SolutionMapper extends BaseMapper<SolutionDto, Solution> {
    SolutionMapper INSTANCE = Mappers.getMapper(SolutionMapper.class);

    @Override
    @Mapping(target = "question", ignore = true)
    Solution toEntity(SolutionDto dto);
}
